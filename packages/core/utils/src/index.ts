import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, de-duplicating conflicting utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate `text` to `length` chars, appending an ellipsis when cut. */
export const truncate = (text: string, length: number) => {
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

/** Format a number using `Intl.NumberFormat` with up to 2 fraction digits. */
export const formatNumber = (number: number, locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(number);
};

export const isObject = (value: unknown): value is Record<any, any> => value !== null && typeof value === 'object';
export const isFunction = (value: unknown): value is (...args: any) => any => typeof value === 'function';
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isUndef = (value: unknown): value is undefined => typeof value === 'undefined';
