import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../interfaces/base-repository.interface';

@Injectable()
export abstract class AbstractBaseRepository<T, CreateDto, UpdateDto> 
  implements BaseRepository<T, CreateDto, UpdateDto> {
  
  constructor(protected readonly prisma: PrismaService) {}

  abstract create(data: CreateDto): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filters?: any): Promise<T[]>;
  abstract update(id: string, data: UpdateDto): Promise<T>;
  abstract delete(id: string): Promise<void>;

  protected async paginate<TModel>(
    model: any,
    options: PaginationOptions,
    where?: any,
    include?: any
  ): Promise<PaginatedResult<TModel>> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 10, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: options.sortBy ? {
          [options.sortBy]: options.sortOrder || 'desc'
        } : undefined,
      }),
      model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  protected buildWhereClause(filters: Record<string, any>): any {
    const where: any = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && key.includes('search')) {
          where[key.replace('search', '')] = {
            contains: value,
            mode: 'insensitive',
          };
        } else if (Array.isArray(value)) {
          where[key] = { in: value };
        } else if (typeof value === 'object' && value.from && value.to) {
          where[key] = {
            gte: value.from,
            lte: value.to,
          };
        } else {
          where[key] = value;
        }
      }
    });

    return where;
  }
}
