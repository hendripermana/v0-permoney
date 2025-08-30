import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { BaseService, ServiceResult, BulkOperationResult } from '../interfaces/base-service.interface';
import { BaseRepository } from '../interfaces/base-repository.interface';

@Injectable()
export abstract class AbstractBaseService<T, CreateDto, UpdateDto> 
  implements BaseService<T, CreateDto, UpdateDto> {
  
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly repository: BaseRepository<T, CreateDto, UpdateDto>) {}

  async create(data: CreateDto): Promise<T> {
    try {
      this.logger.log(`Creating new entity with data: ${JSON.stringify(data)}`);
      await this.validateCreateData(data);
      const result = await this.repository.create(data);
      this.logger.log(`Successfully created entity with id: ${(result as any).id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<T> {
    try {
      this.logger.log(`Finding entity by id: ${id}`);
      const result = await this.repository.findById(id);
      if (!result) {
        throw new NotFoundException(`Entity with id ${id} not found`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Failed to find entity by id ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findMany(filters?: any): Promise<T[]> {
    try {
      this.logger.log(`Finding entities with filters: ${JSON.stringify(filters)}`);
      const result = await this.repository.findMany(filters);
      this.logger.log(`Found ${result.length} entities`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to find entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      this.logger.log(`Updating entity ${id} with data: ${JSON.stringify(data)}`);
      await this.findById(id); // Ensure entity exists
      await this.validateUpdateData(id, data);
      const result = await this.repository.update(id, data);
      this.logger.log(`Successfully updated entity with id: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update entity ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting entity with id: ${id}`);
      await this.findById(id); // Ensure entity exists
      await this.validateDelete(id);
      await this.repository.delete(id);
      this.logger.log(`Successfully deleted entity with id: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete entity ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  protected async validateCreateData(data: CreateDto): Promise<void> {
    // Override in child classes for specific validation
  }

  protected async validateUpdateData(id: string, data: UpdateDto): Promise<void> {
    // Override in child classes for specific validation
  }

  protected async validateDelete(id: string): Promise<void> {
    // Override in child classes for specific validation
  }

  protected createServiceResult<TData>(
    success: boolean,
    data?: TData,
    error?: string,
    message?: string
  ): ServiceResult<TData> {
    return {
      success,
      data,
      error,
      message,
    };
  }

  protected async executeBulkOperation<TData>(
    items: TData[],
    operation: (item: TData) => Promise<void>
  ): Promise<BulkOperationResult> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await operation(item);
        processed++;
      } catch (error) {
        failed++;
        errors.push(error.message);
        this.logger.error(`Bulk operation failed for item: ${error.message}`, error.stack);
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
