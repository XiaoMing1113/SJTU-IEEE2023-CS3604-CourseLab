import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from '../src/components/Auth/ProtectedRoute';
import { authStore } from '../src/stores/authStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authStore
vi.mock('../src/stores/authStore', () => ({
  authStore: {
    isAuthenticated: false,
    user: null,
  },
}));

const TestComponent = () => <div>Protected Content</div>;

const renderProtectedRoute = (children = <TestComponent />) => {
  return render(
    <BrowserRouter>
      <ProtectedRoute>{children}</ProtectedRoute>
    </BrowserRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset authStore state
    authStore.isAuthenticated = false;
    authStore.user = null;
  });

  it('renders children when user is authenticated', () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderProtectedRoute();
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    authStore.isAuthenticated = false;
    authStore.user = null;

    renderProtectedRoute();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is null even if isAuthenticated is true', () => {
    authStore.isAuthenticated = true;
    authStore.user = null;

    renderProtectedRoute();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders multiple children when authenticated', () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderProtectedRoute(
      <div>
        <div>First Child</div>
        <div>Second Child</div>
      </div>
    );
    
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });

  it('does not render anything when not authenticated', () => {
    authStore.isAuthenticated = false;
    authStore.user = null;

    const { container } = renderProtectedRoute();
    
    expect(container.firstChild).toBeNull();
  });

  it('handles authentication state changes', () => {
    // Initially not authenticated
    authStore.isAuthenticated = false;
    authStore.user = null;

    const { rerender } = renderProtectedRoute();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    // Simulate authentication
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    rerender(
      <BrowserRouter>
        <ProtectedRoute><TestComponent /></ProtectedRoute>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('works with complex nested components', () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    const ComplexComponent = () => (
      <div>
        <header>Header</header>
        <main>
          <div>Main Content</div>
          <aside>Sidebar</aside>
        </main>
        <footer>Footer</footer>
      </div>
    );

    renderProtectedRoute(<ComplexComponent />);
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});