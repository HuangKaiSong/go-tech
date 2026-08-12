export type TurnstileFailureReason = 'invalid' | 'unavailable';

const unavailableErrorCodes = new Set([
  'bad-request',
  'internal-error',
  'invalid-input-secret',
  'missing-input-secret'
]);

export const classifyTurnstileFailure = (errorCodes: string[]): TurnstileFailureReason =>
  errorCodes.some(errorCode => unavailableErrorCodes.has(errorCode)) ? 'unavailable' : 'invalid';
