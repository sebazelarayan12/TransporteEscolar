export interface ApiError {
  status: number;
  message: string;
  errors: Record<string, string[]>;
  originalError?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
