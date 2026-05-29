import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateQuietHoursDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(TIME_RE, { message: 'from must be HH:MM' })
  from?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(TIME_RE, { message: 'to must be HH:MM' })
  to?: string | null;

  @IsInt()
  version!: number;
}
