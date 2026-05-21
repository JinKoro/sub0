import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  SubscriptionState,
  type SubscriptionCreateDto,
  type SubscriptionDto,
  type SubscriptionListQuery,
  type SubscriptionListResponse,
  type SubscriptionUpdateDto,
} from '@subzero/shared';

import { computeBackfill, nextBillingDateAfter } from './billing-cycle';
import type {
  SubscriptionRepository,
  SubscriptionServiceDeps,
} from './subscription.types';

const ALLOWED_UPDATE_STATES = new Set<number>([
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
]);

export class SubscriptionService {
  private readonly repo: SubscriptionRepository;
  private readonly now: () => Date;
  private readonly generateSku: (p: 'sub' | 'bil') => string;

  constructor(deps: SubscriptionServiceDeps) {
    this.repo = deps.repo;
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
    this.validatePromoTrial({
      amount: dto.amount,
      isTrial: dto.isTrial,
      promoAmount: dto.promoAmount ?? null,
      promoEndsAt: dto.promoEndsAt ?? null,
    });

    const projectId = await this.repo.findProjectIdBySku(customerId, dto.projectSku);
    if (!projectId) throw new NotFoundException('project not found');

    const categoryId = await this.repo.findCategoryIdBySku(dto.categorySku);
    if (!categoryId) throw new NotFoundException('category not found');

    let serviceId: string | null = null;
    if (dto.serviceSku) {
      const svc = await this.repo.findServiceByCustomSku(dto.serviceSku);
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
    const now = this.now();
    const promoEndsAt = dto.promoEndsAt ? new Date(dto.promoEndsAt) : null;
    const nextBillingDate = nextBillingDateAfter(firstBillingDate, dto.billingPeriodId, now);

    const backfillEntries = computeBackfill({
      firstBillingDate,
      billingPeriod: dto.billingPeriodId,
      amount: dto.amount,
      promoAmount: dto.promoAmount ?? null,
      promoEndsAt,
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
      promoAmount: dto.promoAmount ?? null,
      promoEndsAt,
      comment: (dto.comment ?? '').trim() || null,
      backfill,
    });
  }

  async update(
    customerId: string,
    sku: string,
    dto: SubscriptionUpdateDto,
  ): Promise<SubscriptionDto> {
    if (dto.stateId !== undefined && !ALLOWED_UPDATE_STATES.has(dto.stateId)) {
      throw new BadRequestException('stateId=ARCHIVED is set via DELETE');
    }
    if (dto.amount !== undefined) this.validateAmount(dto.amount);

    const promoTouched =
      dto.promoAmount !== undefined ||
      dto.promoEndsAt !== undefined ||
      dto.isTrial !== undefined;

    if (promoTouched) {
      const existing = await this.repo.findBySku(customerId, sku);
      if (!existing) throw new NotFoundException('subscription not found');
      this.validatePromoTrial({
        amount: dto.amount ?? existing.amount,
        isTrial: dto.isTrial ?? existing.isTrial,
        promoAmount: dto.promoAmount !== undefined ? dto.promoAmount : existing.promoAmount,
        promoEndsAt: dto.promoEndsAt !== undefined ? dto.promoEndsAt : existing.promoEndsAt,
      });
    }

    const patch: Record<string, unknown> = {};
    if (dto.nameCustom !== undefined) patch.nameCustom = (dto.nameCustom ?? '').trim() || null;
    if (dto.iconCustom !== undefined) patch.iconCustom = (dto.iconCustom ?? '').trim() || null;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currencyId !== undefined) patch.currencyId = dto.currencyId;
    if (dto.billingPeriodId !== undefined) patch.billingPeriodId = dto.billingPeriodId;
    if (dto.firstBillingDate !== undefined) patch.firstBillingDate = new Date(dto.firstBillingDate);
    if (dto.isTrial !== undefined) patch.isTrial = dto.isTrial;
    if (dto.promoAmount !== undefined) patch.promoAmount = dto.promoAmount;
    if (dto.promoEndsAt !== undefined) {
      patch.promoEndsAt = dto.promoEndsAt ? new Date(dto.promoEndsAt) : null;
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
        const svc = await this.repo.findServiceByCustomSku(dto.serviceSku);
        if (!svc) throw new NotFoundException('service not found');
        patch.serviceId = svc.id;
      }
    }

    if (dto.firstBillingDate !== undefined || dto.billingPeriodId !== undefined) {
      const existing = await this.repo.findBySku(customerId, sku);
      if (!existing) throw new NotFoundException('subscription not found');
      const firstBillingDate = dto.firstBillingDate
        ? new Date(dto.firstBillingDate)
        : new Date(existing.firstBillingDate);
      const billingPeriodId = dto.billingPeriodId ?? existing.billingPeriodId;
      patch.nextBillingDate = nextBillingDateAfter(firstBillingDate, billingPeriodId, this.now());
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    const ok = await this.repo.update({
      customerId,
      sku,
      version: dto.version,
      patch,
    });
    if (!ok) {
      const existing = await this.repo.findBySku(customerId, sku);
      if (!existing) throw new NotFoundException('subscription not found');
      throw new ConflictException('version mismatch');
    }
    const after = await this.repo.findBySku(customerId, sku);
    if (!after) throw new NotFoundException('subscription not found');
    return after;
  }

  async delete(customerId: string, sku: string): Promise<void> {
    const ok = await this.repo.softDelete(customerId, sku);
    if (!ok) throw new NotFoundException('subscription not found');
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('amount must be > 0');
  }

  private validatePromoTrial(args: {
    amount: string;
    isTrial: boolean;
    promoAmount: string | null;
    promoEndsAt: string | Date | null;
  }): void {
    const hasPromoAmount = args.promoAmount !== null;
    const hasPromoEnd = args.promoEndsAt !== null;
    if (hasPromoAmount !== hasPromoEnd) {
      throw new UnprocessableEntityException('promoAmount/promoEndsAt must be set together');
    }
    if (args.isTrial) {
      if (!hasPromoAmount || !hasPromoEnd) {
        throw new UnprocessableEntityException('trial requires promoAmount=0 + promoEndsAt');
      }
      if (Number(args.promoAmount) !== 0) {
        throw new UnprocessableEntityException('trial requires promoAmount=0');
      }
    } else if (hasPromoAmount) {
      const p = Number(args.promoAmount);
      const a = Number(args.amount);
      if (!Number.isFinite(p) || p <= 0 || p >= a) {
        throw new UnprocessableEntityException('promoAmount must be > 0 and < amount');
      }
    }
  }
}
