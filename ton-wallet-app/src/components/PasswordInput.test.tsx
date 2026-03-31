/**
 * file: PasswordInput.test.tsx
 * description: Unit tests for PasswordInput component.
 * dependencies: PasswordInput, evaluatePassword
 * created: 2026-04-01
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PasswordInput } from './PasswordInput';

// Mock password-strength so tests don't depend on zxcvbn scoring
vi.mock('@/crypto/password-strength', () => ({
  evaluatePassword: (password: string) => ({
    score: password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 4 ? 2 : 1,
    label: password.length >= 8 ? 'Strong' : 'Weak',
    color: '#22c55e',
    warning: '',
    suggestions: password.length < 8 ? ['Use more characters'] : [],
    isAcceptable: password.length >= 8,
  }),
}));

describe('PasswordInput', () => {
  it('renders with type=password by default', () => {
    render(<PasswordInput value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders custom placeholder', () => {
    render(<PasswordInput value="" onChange={() => {}} placeholder="Enter new password" />);
    expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<PasswordInput value="" onChange={() => {}} label="Password" />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('calls onChange with new value on input', () => {
    const handleChange = vi.fn();
    render(<PasswordInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'secret' },
    });
    expect(handleChange).toHaveBeenCalledWith('secret');
  });

  describe('visibility toggle', () => {
    it('toggles type between password and text on button click', () => {
      render(<PasswordInput value="secret" onChange={() => {}} />);
      const input = screen.getByDisplayValue('secret');
      const toggle = screen.getByRole('button', { name: /show password/i });

      expect(input).toHaveAttribute('type', 'password');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('strength indicator', () => {
    it('does not render strength bar when showStrength=false', () => {
      render(<PasswordInput value="somepassword" onChange={() => {}} showStrength={false} />);
      expect(screen.queryByText('Strong')).not.toBeInTheDocument();
      expect(screen.queryByText('Weak')).not.toBeInTheDocument();
    });

    it('does not render strength bar when value is empty', () => {
      render(<PasswordInput value="" onChange={() => {}} showStrength={true} />);
      expect(screen.queryByText('Strong')).not.toBeInTheDocument();
    });

    it('renders strength label when showStrength=true and value is non-empty', () => {
      render(<PasswordInput value="strongpassword123" onChange={() => {}} showStrength={true} />);
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });

    it('renders suggestion when password is weak', () => {
      render(<PasswordInput value="ab" onChange={() => {}} showStrength={true} />);
      expect(screen.getByText(/use more characters/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message when error prop is provided', () => {
      render(<PasswordInput value="" onChange={() => {}} error="Password is required" />);
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('does not render error message when error prop is absent', () => {
      render(<PasswordInput value="" onChange={() => {}} />);
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables the input when disabled=true', () => {
      render(<PasswordInput value="" onChange={() => {}} disabled={true} />);
      expect(screen.getByPlaceholderText('Enter password')).toBeDisabled();
    });

    it('disables the toggle button when disabled=true', () => {
      render(<PasswordInput value="secret" onChange={() => {}} disabled={true} />);
      expect(screen.getByRole('button', { name: /show password/i })).toBeDisabled();
    });
  });
});
