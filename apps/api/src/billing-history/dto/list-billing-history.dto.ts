import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListBillingHistoryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectSku?: string;
}
