/**
 * file: HighlightedAddress.test.tsx
 * description: Unit tests for HighlightedAddress component.
 * dependencies: HighlightedAddress
 * created: 2026-04-01
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HighlightedAddress } from './HighlightedAddress';

// A realistic TON address (48 chars)
const ADDR = 'EQA1_m-uN_p09_Xj4S_U1_7_v_Z_q_6_I_5_X9m3_abc12';

describe('HighlightedAddress', () => {
  describe('full mode (truncate=false)', () => {
    it('renders start, middle, and end parts', () => {
      const { container } = render(<HighlightedAddress address={ADDR} />);
      const spans = container.querySelectorAll('span > span');

      expect(spans[0].textContent).toBe(ADDR.slice(0, 6));   // start
      expect(spans[1].textContent).toBe(ADDR.slice(6, -6));  // middle
      expect(spans[2].textContent).toBe(ADDR.slice(-6));     // end
    });

    it('start and end spans have bold class', () => {
      const { container } = render(<HighlightedAddress address={ADDR} />);
      const spans = container.querySelectorAll('span > span');

      expect(spans[0].className).toContain('font-bold');
      expect(spans[2].className).toContain('font-bold');
    });

    it('middle span does not have font-bold', () => {
      const { container } = render(<HighlightedAddress address={ADDR} />);
      const spans = container.querySelectorAll('span > span');

      expect(spans[1].className).not.toContain('font-bold');
    });

    it('renders full address text combined', () => {
      const { container } = render(<HighlightedAddress address={ADDR} />);
      expect(container.firstChild?.textContent).toBe(ADDR);
    });
  });

  describe('truncated mode (truncate=true)', () => {
    it('renders start, ellipsis, and end — not the full middle', () => {
      const { container } = render(<HighlightedAddress address={ADDR} truncate />);
      const spans = container.querySelectorAll('span > span');

      expect(spans[0].textContent).toBe(ADDR.slice(0, 6));
      expect(spans[1].textContent).toBe('…');
      expect(spans[2].textContent).toBe(ADDR.slice(-6));
    });

    it('does not contain the middle section text', () => {
      const middle = ADDR.slice(6, -6);
      const { container } = render(<HighlightedAddress address={ADDR} truncate />);
      expect(container.firstChild?.textContent).not.toContain(middle);
    });
  });

  describe('short address edge cases', () => {
    it('renders without crashing when address is exactly 12 chars', () => {
      const short = 'EQA1_mX9m3_a'; // 13 chars, middle = 1 char
      render(<HighlightedAddress address={short} />);
      expect(screen.getByText(short.slice(0, 6))).toBeInTheDocument();
    });

    it('renders without crashing when address is shorter than 12 chars', () => {
      // Both slice(0,6) and slice(-6) overlap — graceful degradation
      render(<HighlightedAddress address="short" />);
      // Just should not throw
    });
  });

  describe('className prop', () => {
    it('applies extra className to the root span', () => {
      const { container } = render(
        <HighlightedAddress address={ADDR} className="test-class" />
      );
      expect(container.firstChild).toHaveClass('test-class');
    });
  });
});
