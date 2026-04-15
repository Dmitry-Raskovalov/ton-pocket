/**
 * file: Loader.test.tsx
 * description: Unit tests for Loader component
 * dependencies: Loader.tsx
 * created: 2026-04-15
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader } from './Loader';

describe('Loader', () => {
  it('renders with default aria-label "Loading"', () => {
    render(<Loader />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom text and uses it as aria-label', () => {
    render(<Loader text="Loading wallet..." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading wallet...');
    expect(screen.getByText('Loading wallet...')).toBeInTheDocument();
  });

  it('does not render text element when text prop is omitted', () => {
    render(<Loader />);
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<Loader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
