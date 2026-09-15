export type ClientHttpErrorKind = 'business' | 'http' | 'network';
export type BusinessCode = number | string;

interface ClientHttpErrorInit {
  businessCode?: BusinessCode;
  cause?: unknown;
  kind: ClientHttpErrorKind;
  response?: Response;
  status?: number;
  userMessage?: string;
}

/** 客户端请求的标准错误；只保存错误元数据，不在请求层决定具体 UI。 */
export class ClientHttpError extends Error {
  readonly businessCode?: BusinessCode;
  readonly kind: ClientHttpErrorKind;
  notified = false;
  readonly response?: Response;
  readonly status?: number;
  readonly userMessage?: string;

  constructor(init: ClientHttpErrorInit) {
    const diagnosticMessage =
      init.userMessage ||
      (init.kind === 'network'
        ? 'Network request failed'
        : `Request failed${init.status === undefined ? '' : ` with status ${init.status}`}`);

    super(diagnosticMessage, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'ClientHttpError';
    this.businessCode = init.businessCode;
    this.kind = init.kind;
    this.response = init.response;
    this.status = init.status;
    this.userMessage = init.userMessage;
  }

  markNotified() {
    this.notified = true;
  }
}
