import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  SubscriptionState,
  type NewPromoDto,
  type SubscriptionCreateDto,
  type SubscriptionDto,
  type SubscriptionListQuery,
  type SubscriptionListResponse,
  type SubscriptionUpdateDto,
  type UpdatePromoDto,
} from '@subzero/shared';

import { computeBackfill, nextBillingDateAfter } from './billing-cycle';
import type {
  SubscriptionRepository,
  SubscriptionServiceDeps,
} from './subscription.types';
import type { SubscriptionPromoRepository } from './subscription-promo.types';

const ALLOWED_UPDATE_STATES = new Set<number>([
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
]);

export class SubscriptionService {
  private readonly repo: SubscriptionRepository;
  private readonly promoRepo: SubscriptionPromoRepository;
  private readonly now: () => Date;
  private readonly generateSku: (p: 'sub' | 'bil' | 'spm') => string;

  constructor(deps: SubscriptionServiceDeps) {
    this.repo = deps.repo;
    this.promoRepo = deps.promoRepo;
    this.now = deps.now;
    this.generateSku = deps.generateSku;
  }

  list(customerId: string, q: SubscriptionListQuery): Promise<SubscriptionListResponse> {
    return this.repo.list(customerId, q);
  }

  async get(customerId: string, sku: string): Promise<SubscriptionDto> {
    const found = await this.repo.findBySku(customerId, sku);
    if (!found) throw new NotFoundException('subscription not found');
    return found;
  }

  async create(customerId: string, dto: SubscriptionCreateDto): Promise<SubscriptionDto> {
    this.validateAmount(dto.amount);
    this.validateTrial(dto.isTrial, dto.trialEndsAt ?? null);
    const promos = (dto.promos ?? []).map((p) => this.validateAndNormalisePromo(p, dto.amount));

    const projectId = await this.repo.findProjectIdBySku(customerId, dto.projectSku);
    if (!projectId) throw new NotFoundException('project not found');

    const categoryId = await this.repo.findCategoryIdBySku(dto.categorySku);
    if (!categoryId) throw new NotFoundException('category not found');

    let serviceId: string | null = null;
    if (dto.serviceSku) {
      const svc = await this.repo.findServiceBySku(dto.serviceSku);
      if (!svc) throw new NotFoundException('service not found');
      serviceId = svc.id;
    }

    const nameCustom = (dto.nameCustom ?? '').trim() || null;
    const iconCustom = (dto.iconCustom ?? '').trim() || null;
    if (!serviceId && !nameCustom) {
      throw new UnprocessableEntityException('nameCustom required when serviceSku is empty');
    }

    const firstBillingDate = new Date(dto.firstBillingDate);
    if (Number.isNaN(firstBillingDate.getTime())) {
      throw new BadRequestException('invalid firstBillingDate');
    }
    const trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    const now = this.now();

    let nextBillingDate: Date;
    if (dto.nextBillingDate) {
      const parsed = new Date(dto.nextBillingDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('invalid nextBillingDate');
      }
      if (parsed.getTime() < firstBillingDate.getTime()) {
        throw new UnprocessableEntityException(
          'nextBillingDate must be >= firstBillingDate',
        );
      }
      nextBillingDate = parsed;
    } else {
      nextBillingDate = nextBillingDateAfter(firstBillingDate, dto.billingPeriodId, now);
    }

    const backfillEntries = computeBackfill({
      firstBillingDate,
      billingPeriod: dto.billingPeriodId,
      amount: dto.amount,
      promos: promos.map((p) => ({ amount: p.amount, endsAt: p.endsAt })),
      now,
    });

    const backfill = backfillEntries.map((e) => ({
      sku: this.generateSku('bil'),
      periodStart: e.periodStart,
      periodEnd: e.periodEnd,
      billedAt: e.billedAt,
      amount: e.amount,
      isPromo: e.isPromo,
      currencyId: dto.currencyId,
    }));

    return this.repo.createWithBackfill({
      customerId,
      projectId,
      sku: this.generateSku('sub'),
      serviceId,
      nameCustom,
      iconCustom,
      categoryId,
      amount: dto.amount,
      currencyId: dto.currencyId,
      billingPeriodId: dto.billingPeriodId,
      firstBillingDate,
      nextBillingDate,
      isTrial: dto.isTrial,
      trialEndsAt,
      comment: (dto.comment ?? '').trim() || null,
      promos: promos.map((p) => ({
        sku: this.generateSku('spm'),
        amount: p.amount,
        endsAt: p.endsAt,
      })),
      backfill,
    });
  }

  async update(
    customerId: string,
    sku: string,
    dto: SubscriptionUpdateDto,
  ): Promise<SubscriptionDto> {
    if (dto.stateId !== undefined && !ALLOWED_UPDATE_STATES.has(dto.stateId)) {
      throw new BadRequestException('stateId=ARCHIVED is reserved');
    }
    if (dto.amount !== undefined) this.validateAmount(dto.amount);

    const needsExisting =
      dto.isTrial !== undefined ||
      dto.trialEndsAt !== undefined ||
      dto.promos !== undefined ||
      dto.firstBillingDate !== undefined ||
      dto.nextBillingDate !== undefined ||
      dto.billingPeriodId !== undefined;
    let existing: SubscriptionDto | null = null;
    if (needsExisting) {
      existing = await this.repo.findBySku(customerId, sku);
      if (!existing) throw new NotFoundException('subscription not found');
    }

    // firstBillingDate иммутабельно до появления редактора billing_history.
    // Разрешаем только если совпадает с существующим (FE может прислать его «как есть»).
    if (dto.firstBillingDate !== undefined && existing) {
      const incoming = new Date(dto.firstBillingDate).getTime();
      const current = new Date(existing.firstBillingDate).getTime();
      if (Number.isNaN(incoming)) {
        throw new BadRequestException('invalid firstBillingDate');
      }
      if (incoming !== current) {
        throw new UnprocessableEntityException(
          'firstBillingDate is immutable — edit billing_history records via the history editor (coming soon)',
        );
      }
    }

    if (dto.isTrial !== undefined || dto.trialEndsAt !== undefined) {
      const isTrial = dto.isTrial ?? existing!.isTrial;
      const trialEndsAt =
        dto.trialEndsAt !== undefined ? dto.trialEndsAt : existing!.trialEndsAt;
      this.validateTrial(isTrial, trialEndsAt);
    }

    const patch: Record<string, unknown> = {};
    if (dto.nameCustom !== undefined) patch.nameCustom = (dto.nameCustom ?? '').trim() || null;
    if (dto.iconCustom !== undefined) patch.iconCustom = (dto.iconCustom ?? '').trim() || null;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currencyId !== undefined) patch.currencyId = dto.currencyId;
    if (dto.billingPeriodId !== undefined) patch.billingPeriodId = dto.billingPeriodId;
    if (dto.firstBillingDate !== undefined) patch.firstBillingDate = new Date(dto.firstBillingDate);
    if (dto.isTrial !== undefined) patch.isTrial = dto.isTrial;
    if (dto.trialEndsAt !== undefined) {
      patch.trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    }
    if (dto.comment !== undefined) patch.comment = (dto.comment ?? '').trim() || null;
    if (dto.stateId !== undefined) patch.stateId = dto.stateId;

    if (dto.projectSku !== undefined) {
      const projectId = await this.repo.findProjectIdBySku(customerId, dto.projectSku);
      if (!projectId) throw new NotFoundException('project not found');
      patch.projectId = projectId;
    }
    if (dto.categorySku !== undefined) {
      const categoryId = await this.repo.findCategoryIdBySku(dto.categorySku);
      if (!categoryId) throw new NotFoundException('category not found');
      patch.categoryId = categoryId;
    }
    if (dto.serviceSku !== undefined) {
      if (dto.serviceSku === null) {
        patch.serviceId = null;
      } else {
        const svc = await this.repo.findServiceBySku(dto.serviceSku);
        if (!svc) throw new NotFoundException('service not found');
        patch.serviceId = svc.id;
      }
    }

    if (dto.nextBillingDate !== undefined) {
      // Явный override: используем как есть, валидация >= firstBillingDate.
      if (dto.nextBillingDate === null) {
        // null = «пересчитать автоматически» (редкий путь, для интеграций).
        const firstBillingDate = dto.firstBillingDate
          ? new Date(dto.firstBillingDate)
          : new Date(existing!.firstBillingDate);
        const billingPeriodId = dto.billingPeriodId ?? existing!.billingPeriodId;
        patch.nextBillingDate = nextBillingDateAfter(
          firstBillingDate,
          billingPeriodId,
          this.now(),
        );
      } else {
        const parsed = new Date(dto.nextBillingDate);
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException('invalid nextBillingDate');
        }
        const firstBillingDate = dto.firstBillingDate
          ? new Date(dto.firstBillingDate)
          : new Date(existing!.firstBillingDate);
        if (parsed.getTime() < firstBillingDate.getTime()) {
          throw new UnprocessableEntityException(
            'nextBillingDate must be >= firstBillingDate',
          );
        }
        patch.nextBillingDate = parsed;
      }
    } else if (dto.firstBillingDate !== undefined || dto.billingPeriodId !== undefined) {
      // firstBillingDate или cycle поменялись, nextBillingDate не задан явно — пересчитываем.
      const firstBillingDate = dto.firstBillingDate
        ? new Date(dto.firstBillingDate)
        : new Date(existing!.firstBillingDate);
      const billingPeriodId = dto.billingPeriodId ?? existing!.billingPeriodId;
      patch.nextBillingDate = nextBillingDateAfter(firstBillingDate, billingPeriodId, this.now());
    }

    const hasMainPatch = Object.keys(patch).length > 0;
    const hasPromoPatch = dto.promos !== undefined;
    if (!hasMainPatch && !hasPromoPatch) {
      throw new BadRequestException('no fields to update');
    }

    if (hasMainPatch) {
      const ok = await this.repo.update({ customerId, sku, version: dto.version, patch });
      if (!ok) {
        const after = existing ?? (await this.repo.findBySku(customerId, sku));
        if (!after) throw new NotFoundException('subscription not found');
        throw new ConflictException('version mismatch');
      }
    }

    if (hasPromoPatch) {
      const fresh = (await this.repo.findBySku(customerId, sku))!;
      const subId = await this.repo.findIdBySku(customerId, sku);
      if (!subId) throw new NotFoundException('subscription not found');
      const subscriptionAmount = (patch.amount as string | undefined) ?? fresh.amount;
      await this.syncPromos(subId, fresh, dto.promos!, subscriptionAmount);
    }

    const after = await this.repo.findBySku(customerId, sku);
    if (!after) throw new NotFoundException('subscription not found');
    return after;
  }

  async delete(customerId: string, sku: string): Promise<void> {
    const ok = await this.repo.hardDelete(customerId, sku);
    if (!ok) throw new NotFoundException('subscription not found');
  }

  // ---- private helpers ----

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('amount must be > 0');
  }

  private validateTrial(isTrial: boolean, trialEndsAt: string | null): void {
    if (isTrial && !trialEndsAt) {
      throw new UnprocessableEntityException('trial requires trialEndsAt');
    }
    if (!isTrial && trialEndsAt) {
      throw new UnprocessableEntityException('trialEndsAt must be null when isTrial=false');
    }
  }

  private validateAndNormalisePromo(
    p: NewPromoDto,
    subscriptionAmount: string,
  ): { amount: string; endsAt: Date } {
    const amount = Number(p.amount);
    const subAmount = Number(subscriptionAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount >= subAmount) {
      throw new UnprocessableEntityException('promo amount must be > 0 and < subscription amount');
    }
    const endsAt = new Date(p.endsAt);
    if (Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('promo endsAt is invalid');
    }
    return { amount: p.amount, endsAt };
  }

  private async syncPromos(
    subId: string,
    sub: SubscriptionDto,
    next: Array<NewPromoDto | UpdatePromoDto>,
    subscriptionAmount: string,
  ): Promise<void> {
    const existingBySku = new Map(sub.promos.map((p) => [p.sku, p]));
    const incomingSkus = new Set<string>();

    for (const item of next) {
      // ВАЖНО: используем typeof, а не `'sku' in item`. class-transformer материализует
      // все объявленные поля класса PromoInDto, поэтому `'sku' in item` истинно даже
      // когда sku фактически не передан (item.sku === undefined).
      const isUpdate =
        typeof (item as { sku?: unknown }).sku === 'string' &&
        typeof (item as { version?: unknown }).version === 'number';
      if (isUpdate) {
        const upd = item as { sku: string; version: number; amount?: string; endsAt?: string };
        incomingSkus.add(upd.sku);
        const ex = existingBySku.get(upd.sku);
        if (!ex) throw new NotFoundException('promo not found');
        if (upd.amount !== undefined || upd.endsAt !== undefined) {
          this.validateAndNormalisePromo(
            { amount: upd.amount ?? ex.amount, endsAt: upd.endsAt ?? ex.endsAt },
            subscriptionAmount,
          );
          const ok = await this.promoRepo.update({
            sku: upd.sku,
            subscriptionId: subId,
            version: upd.version,
            patch: {
              amount: upd.amount,
              endsAt: upd.endsAt ? new Date(upd.endsAt) : undefined,
            },
          });
          if (!ok) throw new ConflictException('promo version mismatch');
        }
      } else {
        // Insert path: нет sku/version → новый промо.
        const ins = item as NewPromoDto;
        const norm = this.validateAndNormalisePromo(ins, subscriptionAmount);
        await this.promoRepo.bulkInsert({
          subscriptionId: subId,
          rows: [{ sku: this.generateSku('spm'), amount: norm.amount, endsAt: norm.endsAt }],
        });
      }
    }

    // Delete any existing promo not present in incoming list.
    for (const ex of sub.promos) {
      if (!incomingSkus.has(ex.sku)) {
        await this.promoRepo.softDelete(ex.sku, subId);
      }
    }
  }
}
