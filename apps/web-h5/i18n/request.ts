import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { loadLocale } from '../locales';
import { routing } from './routing';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const resolvedLocale = locale ?? (await requestLocale);
  if (!hasLocale(routing.locales, resolvedLocale)) notFound();

  const messages = loadLocale(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages
  };
});
