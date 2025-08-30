export interface BaseService<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  findById(id: string): Promise<T>;
  findMany(filters?: any): Promise<T[]>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}
