import { ArrayMaxSize, ArrayUnique, IsBoolean, IsIn, IsInt, Min } from 'class-validator';

const ALLOWED_LEAD_DAYS = [0, 1, 3] as const;

/** MVP email-нотификации: общий тоггл + дни до списания.
 *  Дизайн допускает мульти-выбор [3, 1, 0] (где 0 — день списания). */
export class NotificationsDto {
  @IsBoolean()
  enabled!: boolean;

  @IsInt({ each: true })
  @IsIn(ALLOWED_LEAD_DAYS as unknown as number[], { each: true })
  @ArrayUnique()
  @ArrayMaxSize(ALLOWED_LEAD_DAYS.length)
  leadDays!: number[];

  @IsInt()
  @Min(1)
  version!: number;
}
