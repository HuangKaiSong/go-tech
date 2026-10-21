'use client';
import { createNavigation } from 'next-intl/navigation';
import { createElement, type ComponentProps } from 'react';
import { useRuntimeConfig } from '@/lib/runtime-config/provider';
import { routing } from './routing';
function useNavigation() {
  const language = useRuntimeConfig().values.GO_TECH_LANGUAGE;
  const defaultLocale = language === 'en-us' || language === 'zh-cn' ? language : 'zh-hk';
  return createNavigation({ ...routing, defaultLocale });
}
type LinkProps = ComponentProps<ReturnType<typeof createNavigation>['Link']>;
export function Link(props: LinkProps) {
  const navigation = useNavigation();
  return createElement(navigation.Link, props);
}
export function usePathname() {
  return useNavigation().usePathname();
}
export function useRouter() {
  return useNavigation().useRouter();
}
