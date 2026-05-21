import { Inject, Injectable } from '@nestjs/common';
import { ProjectState } from '@subzero/shared';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { project } from '../db/schema/project';
import { subscription } from '../db/schema/subscription';
import type { ProjectRepository, ProjectRow } from './project.types';

@Injectable()
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listActive(customerId: string): Promise<ProjectRow[]> {
    const rows = await this.db
      .select({
        id: project.id,
        sku: project.sku,
        name: project.name,
        color: project.color,
        version: project.version,
        // Count of subscriptions that aren't soft-deleted; counts to 0 when there are none.
        subscriptionsCount: sql<number>`COALESCE(SUM(CASE WHEN ${subscription.id} IS NOT NULL AND ${subscription.deletedAt} IS NULL THEN 1 ELSE 0 END), 0)::int`,
      })
      .from(project)
      .leftJoin(subscription, eq(subscription.projectId, project.id))
      .where(
        and(
          eq(project.customerId, customerId),
          eq(project.stateId, ProjectState.ACTIVE),
          isNull(project.deletedAt),
        ),
      )
      .groupBy(project.id)
      .orderBy(project.createdAt);

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      color: r.color ?? '#0a0a0a',
      subscriptionsCount: r.subscriptionsCount,
      version: r.version,
    }));
  }

  async countActive(customerId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(project)
      .where(
        and(
          eq(project.customerId, customerId),
          eq(project.stateId, ProjectState.ACTIVE),
          isNull(project.deletedAt),
        ),
      );
    return row?.n ?? 0;
  }

  async findActiveById(customerId: string, projectId: string): Promise<ProjectRow | null> {
    const [row] = await this.db
      .select({
        id: project.id,
        sku: project.sku,
        name: project.name,
        color: project.color,
        version: project.version,
      })
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.customerId, customerId),
          eq(project.stateId, ProjectState.ACTIVE),
          isNull(project.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      color: row.color ?? '#0a0a0a',
      subscriptionsCount: 0,
      version: row.version,
    };
  }

  async create(args: {
    customerId: string;
    sku: string;
    name: string;
    color: string;
  }): Promise<ProjectRow> {
    const [row] = await this.db
      .insert(project)
      .values({
        sku: args.sku,
        customerId: args.customerId,
        name: args.name,
        color: args.color,
      })
      .returning({
        id: project.id,
        sku: project.sku,
        name: project.name,
        color: project.color,
        version: project.version,
      });
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      color: row.color ?? args.color,
      subscriptionsCount: 0,
      version: row.version,
    };
  }

  async rename(args: {
    customerId: string;
    projectId: string;
    version: number;
    name: string;
  }): Promise<boolean> {
    const res = await this.db
      .update(project)
      .set({
        name: args.name,
        version: sql`${project.version} + 1`,
      })
      .where(
        and(
          eq(project.id, args.projectId),
          eq(project.customerId, args.customerId),
          eq(project.version, args.version),
          eq(project.stateId, ProjectState.ACTIVE),
          isNull(project.deletedAt),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }

  async hardDelete(customerId: string, projectId: string): Promise<void> {
    // billing_history.project_id has no ON DELETE CASCADE — drop subscriptions
    // first so their billing_history cascade off subscription_id.
    await this.db.transaction(async (tx) => {
      await tx
        .delete(subscription)
        .where(
          and(eq(subscription.projectId, projectId), eq(subscription.customerId, customerId)),
        );
      await tx
        .delete(project)
        .where(and(eq(project.id, projectId), eq(project.customerId, customerId)));
    });
  }
}
