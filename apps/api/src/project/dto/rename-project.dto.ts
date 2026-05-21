import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class RenameProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  // Optimistic lock — client echoes the version it saw.
  @IsInt()
  @Min(1)
  version!: number;
}
