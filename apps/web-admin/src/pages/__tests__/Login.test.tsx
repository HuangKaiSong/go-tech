import { toast } from '@go-tech-frontend/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../Login';

const mocks = vi.hoisted(() => ({
  setToken: vi.fn()
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ setToken: mocks.setToken })
}));

// 登录测试只关心表单，不关心随机出现的 3D、视频或 Canvas 背景。
vi.mock('@/utils/weighted-random', () => ({
  weightedRandom: () => 'static'
}));

vi.mock('@go-tech-frontend/three', () => ({
  Experience: vi.fn(),
  canUseNebula: () => true
}));

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/dashboard' } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>管理后台首页</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Login Page', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    mocks.setToken.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('正常加载登录页面', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: '账户登录' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('請輸入您的電子郵箱/手機號碼')).toHaveValue('');
    expect(screen.getByPlaceholderText('請輸入您的密碼')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: '登入' })).toBeDisabled();
  });

  it('表单没有值, 用户按下 Enter 后页面行为', async () => {
    const toastError = vi.spyOn(toast, 'error').mockImplementation(() => 'toast-id');
    renderLogin();

    fireEvent.keyDown(window, { key: 'Enter', keyCode: 13 });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('請填寫所有欄位');
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('表单有值, 用户按下 Enter 后页面行为', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      json: async () => ({ code: 200, data: { token: 'token-123' } })
    });
    renderLogin();

    await user.type(screen.getByPlaceholderText('請輸入您的電子郵箱/手機號碼'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('請輸入您的密碼'), 'password123');
    fireEvent.keyDown(window, { key: 'Enter', keyCode: 13 });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/go-tech/platform/platformAdmin/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'admin@example.com',
            password: 'password123'
          })
        })
      );
    });
    expect(mocks.setToken).toHaveBeenCalledWith('token-123');
    expect(await screen.findByText('管理后台首页')).toBeInTheDocument();
  });

  it('用户点击密码框右边的 `眼睛👁️`, 密码框从 password 变成 text ', () => {});
});
