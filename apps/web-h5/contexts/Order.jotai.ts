import { atom } from 'jotai';

/**
 * 用户在下单流程中选择的增值服务。
 *
 * key = serviceId，value = 数量。
 * 仅存于内存（Jotai globalStore），刷新页面即重置，不做持久化。
 */
export const selectedServicesAtom = atom<Record<string, number>>({});

/**
 * 用户选择的开通月份。
 *
 * 仅存于内存（Jotai globalStore），刷新页面即重置为默认值 1。
 */
export const selectedMonthsAtom = atom<number>(1);
