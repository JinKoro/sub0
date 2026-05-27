import { IsIn, IsInt } from 'class-validator';
import { PaidPlan } from '@subzero/shared';

export class UpgradePaymentDto {
  @IsInt()
  @IsIn([PaidPlan.PRO_MONTHLY, PaidPlan.PRO_YEARLY])
  paidPlanId!: number;
}
