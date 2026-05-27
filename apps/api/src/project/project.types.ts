export interface ProjectRow {
  id: string;
  sku: string;
  name: string;
  color: string;
  subscriptionsCount: number;
  version: number;
}

export interface ProjectDto {
  id: string;
  sku: string;
  name: string;
  color: string;
  subscriptionsCount: number;
  version: number;
}

export interface ProjectUpdate {
  name?: string;
  color?: string;
}

export interface ProjectRepository {
  /** Active projects for the customer + count of their non-deleted subscriptions. */
  listActive(customerId: string): Promise<ProjectRow[]>;

  /** Count of active (not soft-deleted) projects — for the "must keep one" rule. */
  countActive(customerId: string): Promise<number>;

  /** Текущий план кастомера: для проверки лимита Free перед create. */
  findCustomerPlanId(customerId: string): Promise<number | null>;

  findActiveBySku(customerId: string, sku: string): Promise<ProjectRow | null>;

  create(args: {
    customerId: string;
    sku: string;
    name: string;
    color: string;
  }): Promise<ProjectRow>;

  /**
   * Optimistic lock — `WHERE sku = ? AND customer_id = ? AND version = ?`.
   * Bumps `version`. Returns false when no row matched (stale version / wrong owner).
   */
  update(args: {
    customerId: string;
    sku: string;
    version: number;
    patch: ProjectUpdate;
  }): Promise<boolean>;

  /**
   * Cascade hard-delete in one transaction. Looks up the project by SKU,
   * then drops subscriptions for it (their billing_history cascade off
   * subscription_id), then the project row itself.
   */
  hardDelete(customerId: string, sku: string): Promise<void>;
}
