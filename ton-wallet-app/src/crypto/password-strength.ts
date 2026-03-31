/**
 * file: password-strength.ts
 * description: Password strength evaluation using zxcvbn-ts.
 *   Returns score (0–4), feedback, and acceptability flag for UI and validation.
 * dependencies: zxcvbn-ts
 * created: 2026-03-31
 */

import { zxcvbn } from 'zxcvbn-ts';

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: StrengthScore;
  label: string;
  color: string;
  warning: string;
  suggestions: readonly string[];
  isAcceptable: boolean;
}

const SCORE_LABELS: Record<StrengthScore, string> = {
  0: 'Very weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very strong',
};

const SCORE_COLORS: Record<StrengthScore, string> = {
  0: '#ef4444', // red-500
  1: '#f97316', // orange-500
  2: '#eab308', // yellow-500
  3: '#22c55e', // green-500
  4: '#16a34a', // green-600
};

const MIN_LENGTH = 8;
const MIN_SCORE: StrengthScore = 2;

/**
 * Evaluate password strength using zxcvbn.
 * A password is acceptable if score >= 2 AND length >= 8.
 */
export function evaluatePassword(password: string): PasswordStrength {
  const result = zxcvbn(password);
  const score = result.score as StrengthScore;
  const { warning, suggestions } = result.feedback;

  return {
    score,
    label: SCORE_LABELS[score],
    color: SCORE_COLORS[score],
    warning: warning ?? '',
    suggestions: suggestions ?? [],
    isAcceptable: score >= MIN_SCORE && password.length >= MIN_LENGTH,
  };
}
