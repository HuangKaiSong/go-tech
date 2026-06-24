import type { HttpBaseResponse as CoreHttpBaseResponse } from '@go-tech/core-types';

declare global {
  type HttpBaseResponse<T = any> = CoreHttpBaseResponse<T>;
}
