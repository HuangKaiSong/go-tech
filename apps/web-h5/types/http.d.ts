import type { HttpBaseResponse as CoreHttpBaseResponse } from '@go-tech/types';

declare global {
  type HttpBaseResponse<T = any> = CoreHttpBaseResponse<T>;
}
