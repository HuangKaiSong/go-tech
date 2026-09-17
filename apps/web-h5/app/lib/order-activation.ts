import { OrderStatusEnum, OrderTypeEnum } from '../constants/order';
import { PayTypeEnum } from '../constants/payment';

interface OrderActivationPollingState {
  fromKpay: boolean;
  orderStatus: OrderStatusEnum;
  payType: PayTypeEnum;
}

interface TenantSyncOrderState {
  orderStatus: OrderStatusEnum;
  orderType: OrderTypeEnum;
}

interface PendingTenantActivationInput {
  orderId: number;
  ownerId: string;
  payType: PayTypeEnum;
}

export interface PendingTenantActivation extends PendingTenantActivationInput {
  expiresAt: number;
}

interface TenantActivationStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

interface TenantActivationStorageOptions {
  now?: () => number;
  storage?: TenantActivationStorage;
}

const PENDING_TENANT_ACTIVATION_KEY = 'GO_TECH_PENDING_TENANT_ACTIVATION';
const ONLINE_TENANT_ACTIVATION_INTERVAL = 5_000;
const ONLINE_TENANT_ACTIVATION_TIMEOUT = 5 * 60_000;
const FPS_TENANT_ACTIVATION_INTERVAL = 60_000;
const FPS_TENANT_ACTIVATION_TIMEOUT = 24 * 60 * 60_000;

interface PollScheduler {
  clear: (handle: unknown) => void;
  set: (callback: () => void, delay: number) => unknown;
}

interface VisibilityAwarePollerOptions {
  intervalMs: number;
  isVisible: () => boolean;
  now?: () => number;
  onError?: (error: unknown) => void;
  onStop?: () => void;
  poll: (signal: AbortSignal) => Promise<boolean>;
  scheduler?: PollScheduler;
  timeoutMs: number;
}

const defaultScheduler: PollScheduler = {
  clear(handle) {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
  set(callback, delay) {
    return setTimeout(callback, delay);
  }
};

function getTenantActivationStorage(options: TenantActivationStorageOptions) {
  if (options.storage) return options.storage;
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

function isPendingTenantActivation(value: unknown): value is PendingTenantActivation {
  if (!value || typeof value !== 'object') return false;
  const pending = value as Partial<PendingTenantActivation>;

  return (
    Number.isSafeInteger(pending.orderId) &&
    Number(pending.orderId) > 0 &&
    typeof pending.ownerId === 'string' &&
    pending.ownerId.length > 0 &&
    (pending.payType === PayTypeEnum.FPS || pending.payType === PayTypeEnum.Online) &&
    typeof pending.expiresAt === 'number' &&
    Number.isFinite(pending.expiresAt)
  );
}

export function getTenantActivationPollingConfig(pending: PendingTenantActivation, now = Date.now()) {
  const isOnline = pending.payType === PayTypeEnum.Online;
  return {
    intervalMs: isOnline ? ONLINE_TENANT_ACTIVATION_INTERVAL : FPS_TENANT_ACTIVATION_INTERVAL,
    timeoutMs: Math.max(0, pending.expiresAt - now)
  };
}

export function stashPendingTenantActivation(
  input: PendingTenantActivationInput,
  options: TenantActivationStorageOptions = {}
) {
  const now = (options.now ?? Date.now)();
  const timeout =
    input.payType === PayTypeEnum.Online ? ONLINE_TENANT_ACTIVATION_TIMEOUT : FPS_TENANT_ACTIVATION_TIMEOUT;
  const pending: PendingTenantActivation = {
    ...input,
    expiresAt: now + timeout
  };
  const storage = getTenantActivationStorage(options);

  try {
    storage?.setItem(PENDING_TENANT_ACTIVATION_KEY, JSON.stringify(pending));
  } catch {
    // 存储不可用时仍返回任务，由当前 Provider 生命周期继续同步。
  }

  return pending;
}

export function clearPendingTenantActivation(options: TenantActivationStorageOptions = {}) {
  try {
    getTenantActivationStorage(options)?.removeItem(PENDING_TENANT_ACTIVATION_KEY);
  } catch {
    // sessionStorage 不可用时无需额外处理。
  }
}

export function readPendingTenantActivation(options: TenantActivationStorageOptions = {}) {
  const storage = getTenantActivationStorage(options);
  if (!storage) return null;

  try {
    const raw = storage.getItem(PENDING_TENANT_ACTIVATION_KEY);
    if (!raw) return null;
    const pending: unknown = JSON.parse(raw);
    if (isPendingTenantActivation(pending)) return pending;
  } catch {
    // 损坏的任务会在下面清除。
  }

  clearPendingTenantActivation({ storage });
  return null;
}

export function shouldPollOrderActivation({ fromKpay, orderStatus, payType }: OrderActivationPollingState) {
  if (!fromKpay || payType !== PayTypeEnum.Online) return false;

  return (
    orderStatus === OrderStatusEnum.WAIT_PAY ||
    orderStatus === OrderStatusEnum.PROCESSING ||
    orderStatus === OrderStatusEnum.ACTIVATION
  );
}

export function shouldSyncTenantsForOrder({ orderStatus, orderType }: TenantSyncOrderState) {
  return orderType === OrderTypeEnum.PURCHASE && orderStatus === OrderStatusEnum.COMPLETED;
}

export function createVisibilityAwarePoller({
  intervalMs,
  isVisible,
  now = Date.now,
  onError,
  onStop,
  poll,
  scheduler = defaultScheduler,
  timeoutMs
}: VisibilityAwarePollerOptions) {
  let activeController: AbortController | null = null;
  let deadline = 0;
  let inFlight = false;
  let resumeImmediately = false;
  let started = false;
  let stopped = false;
  let timer: unknown = null;

  const clearScheduledPoll = () => {
    if (timer === null) return;
    scheduler.clear(timer);
    timer = null;
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    resumeImmediately = false;
    clearScheduledPoll();
    activeController?.abort();
    onStop?.();
  };

  let runPoll: () => Promise<void>;

  const schedulePoll = (delay: number) => {
    if (stopped || inFlight || timer !== null) return;
    timer = scheduler.set(() => {
      timer = null;
      runPoll();
    }, delay);
  };

  runPoll = async () => {
    if (!started || stopped || inFlight) return;
    const isResumePoll = resumeImmediately;
    resumeImmediately = false;
    if (now() >= deadline && !isResumePoll) {
      stop();
      return;
    }
    if (!isVisible()) return;

    inFlight = true;
    const controller = new AbortController();
    activeController = controller;
    let shouldContinue = true;

    try {
      shouldContinue = await poll(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) onError?.(error);
    } finally {
      inFlight = false;
      if (activeController === controller) activeController = null;
    }

    if (stopped) return;
    if (!shouldContinue) {
      stop();
      return;
    }
    if (!isVisible()) return;
    if (resumeImmediately) {
      schedulePoll(0);
      return;
    }
    if (now() >= deadline) {
      stop();
      return;
    }

    schedulePoll(intervalMs);
  };

  return {
    handleVisibilityChange() {
      if (!started || stopped) return;
      if (!isVisible()) {
        resumeImmediately = false;
        clearScheduledPoll();
        activeController?.abort();
        return;
      }

      resumeImmediately = true;
      if (!inFlight) schedulePoll(0);
    },
    start() {
      if (started || stopped) return;
      started = true;
      deadline = now() + timeoutMs;
      if (isVisible()) schedulePoll(intervalMs);
    },
    stop
  };
}
