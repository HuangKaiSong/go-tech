import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMonitorReports } from './monitor-api';
import MonitorListPage from './monitor-list-page';
import { monitorTimeBound, monitorTimeInput } from './monitor-time-range';

vi.mock('./monitor-api', () => ({ getMonitorReports: vi.fn() }));
const getReports = vi.mocked(getMonitorReports);
function mount(search = '?view=error') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/monitor${search}`]}>
        <MonitorListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  getReports.mockReset();
  getReports.mockResolvedValue({ items: [], nextCursor: null });
});
describe('monitor time range', () => {
  it('converts UTC+8 input independently of browser timezone and includes the end minute', () => {
    expect(monitorTimeBound('2026-10-16T08:00')).toBe(String(Date.parse('2026-10-16T00:00:00Z')));
    expect(monitorTimeBound('2026-10-16T08:00', true)).toBe(String(Date.parse('2026-10-16T00:00:59.999Z')));
    expect(monitorTimeInput(monitorTimeBound('2026-10-16T08:00', true))).toBe('2026-10-16T08:00');
    expect(() => monitorTimeBound('2026-02-30T08:00')).toThrow();
  });
  it('applies the range to server requests, keeps it when switching tabs, and resets it', async () => {
    mount();
    await waitFor(() => expect(getReports).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('開始時間（UTC+8）'), { target: { value: '2026-10-16T08:00' } });
    fireEvent.change(screen.getByLabelText('結束時間（UTC+8）'), { target: { value: '2026-10-16T09:00' } });
    fireEvent.click(screen.getByRole('button', { name: '篩選' }));
    await waitFor(() =>
      expect(getReports.mock.calls.at(-1)?.[0].get('from')).toBe(monitorTimeBound('2026-10-16T08:00'))
    );
    expect(getReports.mock.calls.at(-1)?.[0].get('to')).toBe(monitorTimeBound('2026-10-16T09:00', true));
    fireEvent.mouseDown(screen.getByRole('tab', { name: '性能指標' }), { button: 0, ctrlKey: false });
    await waitFor(() => expect(getReports.mock.calls.at(-1)?.[0].get('kind')).toBe('performance'));
    expect(getReports.mock.calls.at(-1)?.[0].has('from')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '重設' }));
    await waitFor(() => expect(getReports.mock.calls.at(-1)?.[0].has('from')).toBe(false));
    expect(screen.getByLabelText('開始時間（UTC+8）')).toHaveValue('');
  });
  it('rejects a reversed range without issuing a query', async () => {
    mount();
    await waitFor(() => expect(getReports).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('開始時間（UTC+8）'), { target: { value: '2026-10-16T10:00' } });
    fireEvent.change(screen.getByLabelText('結束時間（UTC+8）'), { target: { value: '2026-10-16T09:00' } });
    fireEvent.click(screen.getByRole('button', { name: '篩選' }));
    expect(screen.getByRole('alert')).toHaveTextContent('開始時間不能晚於結束時間');
    expect(getReports).toHaveBeenCalledTimes(1);
  });
  it('restores URL filters and preserves both bounds on subsequent pages', async () => {
    const cursor = '11111111-1111-4111-8111-111111111111';
    getReports.mockResolvedValueOnce({ items: [], nextCursor: cursor });
    mount('?view=error&from=1792108800000&to=1792112399999');
    await screen.findByRole('button', { name: '載入更多' });
    expect(screen.getByLabelText('開始時間（UTC+8）')).toHaveValue(monitorTimeInput('1792108800000'));
    fireEvent.click(screen.getByRole('button', { name: '載入更多' }));
    await waitFor(() => expect(getReports.mock.calls.at(-1)?.[0].get('cursor')).toBe(cursor));
    expect(getReports.mock.calls.at(-1)?.[0].get('from')).toBe('1792108800000');
    expect(getReports.mock.calls.at(-1)?.[0].get('to')).toBe('1792112399999');
  });
});
