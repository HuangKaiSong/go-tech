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
