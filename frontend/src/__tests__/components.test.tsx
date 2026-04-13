import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

function RouterWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('NotFoundPage', () => {
  it('renders 404 message', async () => {
    const { default: NotFoundPage } = await import('../components/NotFoundPage');
    render(
      <RouterWrapper>
        <NotFoundPage />
      </RouterWrapper>,
    );
    expect(screen.getByText('الصفحة غير موجودة')).toBeTruthy();
    expect(screen.getByText('404')).toBeTruthy();
  });

  it('has a link back to home', async () => {
    const { default: NotFoundPage } = await import('../components/NotFoundPage');
    render(
      <RouterWrapper>
        <NotFoundPage />
      </RouterWrapper>,
    );
    const homeLink = screen.getByText('العودة للرئيسية');
    expect(homeLink.closest('a')?.getAttribute('href')).toBe('/');
  });
});

describe('ToastProvider', () => {
  it('renders toast notifications', async () => {
    const { ToastProvider, useToast } = await import('../contexts/ToastContext');
    
    function TestComponent() {
      const { success, error } = useToast();
      return (
        <>
          <button onClick={() => success('نجاح!')}>success</button>
          <button onClick={() => error('خطأ!')}>error</button>
        </>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('success'));
    await waitFor(() => {
      expect(screen.getByText('نجاح!')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('error'));
    await waitFor(() => {
      expect(screen.getByText('خطأ!')).toBeTruthy();
    });
  });
});

describe('AuthContext', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    try { localStorage.clear(); } catch {}
  });

  it('starts unauthenticated', async () => {
    const { AuthProvider, useAuth } = await import('../contexts/AuthContext');
    
    function TestComp() {
      const { isAuthenticated, user } = useAuth();
      return <span>{isAuthenticated ? 'logged-in' : 'logged-out'}</span>;
    }

    render(
      <AuthProvider>
        <TestComp />
      </AuthProvider>,
    );

    expect(screen.getByText('logged-out')).toBeTruthy();
  });

  it('handles login error', async () => {
    const { AuthProvider, useAuth } = await import('../contexts/AuthContext');
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'بيانات خاطئة' }),
    });

    function TestComp() {
      const { login, isAuthenticated } = useAuth();
      return (
        <button onClick={() => login('test@test.com', 'wrong').catch(() => {})}>
          {isAuthenticated ? 'yes' : 'no'}
        </button>
      );
    }

    render(
      <AuthProvider>
        <TestComp />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('no'));
    await waitFor(() => {
      expect(screen.getByText('no')).toBeTruthy();
    });
  });
});
