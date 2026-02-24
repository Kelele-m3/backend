import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const CATEGORIES = ['Politics', 'Tech', 'Sports', 'Health'] as const;

export class SearchArticleDto {
  @ApiPropertyOptional({ enum: [...CATEGORIES], description: 'Filter by exact category' })
  @IsOptional()
  @IsString()
  @IsIn([...CATEGORIES], { message: 'Category must be one of: Politics, Tech, Sports, Health' })
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by author name (partial match)' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Keyword search in title' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size (default 10, max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 10;
}
