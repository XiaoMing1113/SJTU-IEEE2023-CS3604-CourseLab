import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProfilePage from '../src/pages/ProfilePage';

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
const mockAuthStore = {
  user: {
    id: '1',
    phone: '13800138000',
    realName: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://example.com/avatar.jpg',
  },
  isAuthenticated: true,
  token: 'mock-token',
  updateUser: vi.fn(),
};

vi.mock('../src/stores/authStore', () => ({
  default: mockAuthStore,
}));

// Mock fetch
global.fetch = vi.fn();

const renderProfilePage = () => {
  return render(
    <BrowserRouter>
      <ProfilePage />
    </BrowserRouter>
  );
};

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
    mockAuthStore.updateUser.mockClear();
  });

  it('renders profile page with user information', () => {
    renderProfilePage();
    
    expect(screen.getByText('个人资料')).toBeInTheDocument();
    expect(screen.getByDisplayValue('张三')).toBeInTheDocument();
    expect(screen.getByDisplayValue('13800138000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('zhangsan@example.com')).toBeInTheDocument();
  });

  it('displays user avatar', () => {
    renderProfilePage();
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('allows editing profile information', async () => {
    renderProfilePage();
    
    const nameInput = screen.getByDisplayValue('张三');
    const emailInput = screen.getByDisplayValue('zhangsan@example.com');
    
    fireEvent.change(nameInput, { target: { value: '李四' } });
    fireEvent.change(emailInput, { target: { value: 'lisi@example.com' } });
    
    expect(nameInput).toHaveValue('李四');
    expect(emailInput).toHaveValue('lisi@example.com');
  });

  it('validates required fields', async () => {
    renderProfilePage();
    
    const nameInput = screen.getByDisplayValue('张三');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入真实姓名')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderProfilePage();
    
    const emailInput = screen.getByDisplayValue('zhangsan@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入正确的邮箱地址')).toBeInTheDocument();
    });
  });

  it('saves profile changes successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: {
          id: '1',
          phone: '13800138000',
          realName: '李四',
          email: 'lisi@example.com',
          avatar: 'https://example.com/avatar.jpg',
        }
      }),
    });

    renderProfilePage();
    
    const nameInput = screen.getByDisplayValue('张三');
    const emailInput = screen.getByDisplayValue('zhangsan@example.com');
    
    fireEvent.change(nameInput, { target: { value: '李四' } });
    fireEvent.change(emailInput, { target: { value: 'lisi@example.com' } });
    
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          realName: '李四',
          email: 'lisi@example.com',
        }),
      });
    });

    await waitFor(() => {
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({
        id: '1',
        phone: '13800138000',
        realName: '李四',
        email: 'lisi@example.com',
        avatar: 'https://example.com/avatar.jpg',
      });
    });
  });

  it('handles profile update failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '更新失败' }),
    });

    renderProfilePage();
    
    const nameInput = screen.getByDisplayValue('张三');
    fireEvent.change(nameInput, { target: { value: '李四' } });
    
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Should not update store on failure
      expect(mockAuthStore.updateUser).not.toHaveBeenCalled();
    });
  });

  it('shows loading state during profile update', async () => {
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderProfilePage();
    
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('保存中...')).toBeInTheDocument();
  });

  it('allows changing password', async () => {
    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    expect(screen.getByPlaceholderText('请输入当前密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入新密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请确认新密码')).toBeInTheDocument();
  });

  it('validates password change form', async () => {
    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    const changePasswordButton = screen.getByText('修改密码', { selector: 'button' });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入当前密码')).toBeInTheDocument();
      expect(screen.getByText('请输入新密码')).toBeInTheDocument();
      expect(screen.getByText('请确认新密码')).toBeInTheDocument();
    });
  });

  it('validates new password length', async () => {
    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
    fireEvent.change(newPasswordInput, { target: { value: '123' } });
    
    const changePasswordButton = screen.getByText('修改密码', { selector: 'button' });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(screen.getByText('密码长度至少6位')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmPasswordInput = screen.getByPlaceholderText('请确认新密码');
    
    fireEvent.change(newPasswordInput, { target: { value: '123456' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '654321' } });
    
    const changePasswordButton = screen.getByText('修改密码', { selector: 'button' });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    });
  });

  it('changes password successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: '密码修改成功' }),
    });

    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    const currentPasswordInput = screen.getByPlaceholderText('请输入当前密码');
    const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmPasswordInput = screen.getByPlaceholderText('请确认新密码');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });
    
    const changePasswordButton = screen.getByText('修改密码', { selector: 'button' });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword',
        }),
      });
    });
  });

  it('handles password change failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '当前密码错误' }),
    });

    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    const currentPasswordInput = screen.getByPlaceholderText('请输入当前密码');
    const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmPasswordInput = screen.getByPlaceholderText('请确认新密码');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'wrongpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });
    
    const changePasswordButton = screen.getByText('修改密码', { selector: 'button' });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Error should be handled by the component
    });
  });

  it('allows uploading avatar', async () => {
    renderProfilePage();
    
    const uploadButton = screen.getByText('更换头像');
    expect(uploadButton).toBeInTheDocument();
    
    // Test file input
    const fileInput = screen.getByLabelText('更换头像');
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // The upload logic should be implemented in the component
  });

  it('validates avatar file type', async () => {
    renderProfilePage();
    
    const fileInput = screen.getByLabelText('更换头像');
    const file = new File(['document'], 'document.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('只能上传 JPG/PNG 格式的图片')).toBeInTheDocument();
    });
  });

  it('validates avatar file size', async () => {
    renderProfilePage();
    
    const fileInput = screen.getByLabelText('更换头像');
    // Create a large file (> 2MB)
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('图片大小不能超过 2MB')).toBeInTheDocument();
    });
  });

  it('uploads avatar successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { avatarUrl: 'https://example.com/new-avatar.jpg' }
      }),
    });

    renderProfilePage();
    
    const fileInput = screen.getByLabelText('更换头像');
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
        body: expect.any(FormData),
      });
    });
  });

  it('handles avatar upload failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '上传失败' }),
    });

    renderProfilePage();
    
    const fileInput = screen.getByLabelText('更换头像');
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Error should be handled by the component
    });
  });

  it('redirects to login if not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(mockAuthStore).isAuthenticated = false;
    vi.mocked(mockAuthStore).user = null;

    renderProfilePage();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows default avatar when user has no avatar', () => {
    // Mock user without avatar
    const userWithoutAvatar = {
      ...mockAuthStore.user,
      avatar: null,
    };
    vi.mocked(mockAuthStore).user = userWithoutAvatar;

    renderProfilePage();
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', expect.stringContaining('default'));
  });

  it('resets password form after successful change', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: '密码修改成功' }),
    });

    renderProfilePage();
    
    const changePasswordTab = screen.getByText('修改密码');
    fireEvent.click(changePasswordTab);
    
    const currentPasswordInput = screen.getByPlaceholderText('请输入当前密码');
    const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
    const confirmPasswordInput = screen.getByPlaceholderText('请确认新密码');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });
    
    const changePasswordButton = screen.getByText('修改密码', { selector: 'button' });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(currentPasswordInput).toHaveValue('');
      expect(newPasswordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    });
  });
});