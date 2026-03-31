/**
 * Validation types.
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface Warning {
  type: string;
  message: string;
  severity: ValidationSeverity;
  /** blocking=true означает, что пользователь должен явно подтвердить предупреждение */
  blocking: boolean;
}

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
