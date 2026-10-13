import { type MonitorReport } from '@go-tech/monitor-contract';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { formatMonitorTime } from './monitor-context';
import { ReportContent } from './monitor-detail-page';

vi.mock('./monitor-replay', () => ({ MonitorReplay: () => <div>TEST_REPLAY_PLAYER</div> }));

function report(kind: 'next-server' | 'react-client'): MonitorReport {
  return {
    schemaVersion: 1,
    id: '11111111-1111-4111-8111-111111111111',
    timestamp: Date.parse('2026-10-13T01:02:03.456Z'),
    timeSource: kind === 'next-server' ? 'server' : 'client',
    kind: 'error',
    context: {
      app: 'web-h5',
      sessionId: '11111111-1111-4111-8111-111111111111',
      pageId: '11111111-1111-4111-8111-111111111111',
      path: '/feedback',
      release: 'test',
      userAgent: 'test-device',
      language: 'zh-HK',
      viewport: { width: 100, height: 100 },
      device: { platform: 'macOS', timezone: 'Asia/Shanghai', mobile: false },
      authentication: {
        status: 'verified',
        userId: '42',
        username: 'test-user',
        token: 'test-token',
        cookie: 'GO_TECH_AUTH_TOKEN=test-token'
      }
    },
    error: { kind, name: 'Error', message: 'test failure' },
    breadcrumbs: [],
    metrics: [],
    // Even historical server records containing events must not display a player.
    replay: { events: [{ type: 2, timestamp: 1, data: {} }] }
  };
}

describe('monitor error details', () => {
  it('shows server time, device and authentication, with no replay player or replay download', () => {
    render(<ReportContent report={report('next-server')} />);
    expect(screen.queryByText('TEST_REPLAY_PLAYER')).toBeNull();
    expect(screen.queryByRole('button', { name: '下載回放 JSON' })).toBeNull();
    expect(screen.getByText('伺服器時鐘')).toBeTruthy();
    expect(screen.getByText('macOS')).toBeTruthy();
    expect(screen.getByText('test-user')).toBeTruthy();
    expect(screen.getByText('test-token')).toBeTruthy();
    expect(screen.getByText('GO_TECH_AUTH_TOKEN=test-token')).toBeTruthy();
    expect(formatMonitorTime(Date.parse('2026-10-13T01:02:03.456Z'))).toContain('09:02:03.456');
    expect(formatMonitorTime(Date.parse('2026-10-13T01:02:03.456Z'))).toContain('GMT+8');
  });
  it('preserves replay for React client errors', () => {
    render(<ReportContent report={report('react-client')} />);
    expect(screen.getByText('TEST_REPLAY_PLAYER')).toBeTruthy();
    expect(screen.getByRole('button', { name: '下載回放 JSON' })).toBeTruthy();
  });
});
