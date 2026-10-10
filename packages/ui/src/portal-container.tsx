'use client';

import { type ComponentType, type ReactNode, createContext, useContext } from 'react';

interface PortalContainerValue {
  boundary?: HTMLElement;
  container?: HTMLElement | null;
}

const PortalContainerContext = createContext<PortalContainerValue>({});

/** Optional portal scope; consumers without a provider retain Radix's document defaults. */
export function PortalContainerProvider({
  boundary,
  children,
  container
}: PortalContainerValue & { children: ReactNode }) {
  return <PortalContainerContext.Provider value={{ container, boundary }}>{children}</PortalContainerContext.Provider>;
}

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}

export function createScopedPortal<Props extends { container?: Element | DocumentFragment | null }>(
  Portal: ComponentType<Props>
) {
  return function ScopedPortal(props: Props) {
    const { container } = usePortalContainer();
    if (container === null && (props.container === null || props.container === undefined)) return null;
    return <Portal {...props} container={props.container ?? container} />;
  };
}
