import { PortalContainerProvider, createScopedPortal } from '@go-tech-frontend/ui';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { expect, it } from 'vitest';

const ScopedPortal = createScopedPortal(
  ({ children, container }: { children: ReactNode; container?: Element | DocumentFragment | null }) =>
    createPortal(children, container ?? document.body)
);

it('uses the provider host and retains document defaults without a provider', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const result = render(
    <PortalContainerProvider container={host}>
      <ScopedPortal>Scoped content</ScopedPortal>
    </PortalContainerProvider>
  );
  expect(host.contains(screen.getByText('Scoped content'))).toBe(true);
  result.unmount();
  host.remove();
  render(<ScopedPortal>Default content</ScopedPortal>);
  expect(document.body.contains(screen.getByText('Default content'))).toBe(true);
});

it('does not flash a modal outside a frame while its host is mounting', () => {
  render(
    <PortalContainerProvider container={null}>
      <ScopedPortal>Pending content</ScopedPortal>
    </PortalContainerProvider>
  );
  expect(screen.queryByText('Pending content')).toBeNull();
});
