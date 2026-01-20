import { lazy } from 'react'

export function lazyPage<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(factory)
}
