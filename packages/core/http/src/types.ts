/** Error thrown by {@link HttpClient} for network failures or non-ok responses. */
export class HttpError extends Error {
  readonly status?: number;
  readonly payload?: unknown;

  constructor(message: string, init?: { cause?: unknown; payload?: unknown; status?: number }) {
    super(message, init?.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'HttpError';
    this.status = init?.status;
    this.payload = init?.payload;
  }
}

/**
 * Runtime capabilities injected into {@link HttpClient}. Each application
 * supplies its own implementation (Next.js `cookies()`, browser
 * `localStorage`, etc.), keeping the kernel free of framework imports.
 */
export interface HttpAdapter {
  /** Headers merged into every request (static or computed per-request). */
  defaultHeaders?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  /** Resolve the API base URL. A trailing slash is normalized away. */
  getBaseUrl: () => string | Promise<string>;
  /** Resolve the auth token for the current runtime. */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Invoked for any network failure or non-ok response. */
  onError?: (error: HttpError) => void | Promise<void>;
  /**
   * Invoked specifically on a 401 response. Phase 3 can wire this to reset
   * auth state (e.g. clear Jotai atoms) and redirect to login.
   */
  onUnauthorized?: () => void | Promise<void>;
  /**
   * When `true`, a non-ok response resolves with the parsed body instead of
   * throwing an {@link HttpError}. Use for APIs that encode errors in the
   * response envelope (e.g. `{ code, message }`). Defaults to `false`.
   */
  returnErrorBody?: boolean;
}

/** Per-request options. `body` is serialized once by the kernel. */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string>;
}
