export interface BaseRepository<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filters?: any): Promise<T[]>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
