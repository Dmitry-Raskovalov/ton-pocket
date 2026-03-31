/**
 * Validation types.
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  field?: string;
  acknowledged: boolean;
}

export interface ValidationContext {
  fromAddress: string;
  toAddress: string;
  amount: bigint;
  balance: bigint;
  fee: bigint;
}
