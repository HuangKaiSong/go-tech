/** Standard envelope returned by the platform API. */
export interface HttpBaseResponse<T = any> {
  code?: number;
  data?: T;
  [key: string]: any;
}
