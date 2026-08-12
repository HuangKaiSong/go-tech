'use client';

const MINIMUM_VISIBLE_TIME = 240;
const MAXIMUM_VISIBLE_TIME = 10_000;

let completionTimer: number | undefined;
let safetyTimer: number | undefined;
let isNavigating = false;
let startedAt = 0;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function setIsNavigating(value: boolean) {
  if (isNavigating === value) return;

  isNavigating = value;
  notifyListeners();
}

function clearTimer(timer: number | undefined) {
  if (timer !== undefined) window.clearTimeout(timer);
}

function finishNavigationTransition() {
  clearTimer(completionTimer);
  clearTimer(safetyTimer);
  completionTimer = undefined;
  safetyTimer = undefined;
  setIsNavigating(false);
}

export function startNavigationTransition() {
  clearTimer(completionTimer);
  clearTimer(safetyTimer);
  completionTimer = undefined;
  startedAt = Date.now();
  setIsNavigating(true);

  safetyTimer = window.setTimeout(finishNavigationTransition, MAXIMUM_VISIBLE_TIME);
}

export function completeNavigationTransition() {
  if (!isNavigating) return;

  const remainingTime = Math.max(0, MINIMUM_VISIBLE_TIME - (Date.now() - startedAt));
  clearTimer(completionTimer);
  completionTimer = window.setTimeout(finishNavigationTransition, remainingTime);
}

export function subscribeNavigationProgress(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getNavigationProgressSnapshot() {
  return isNavigating;
}
