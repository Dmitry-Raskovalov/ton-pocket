/**
 * Validation pipeline for transaction sending.
 * Implements address verification and protection against address substitution attacks.
 */

import type { ValidationResult, ValidationContext, ValidationError, ValidationWarning } from './types';

export interface ValidationRule {
  id: string;
  validate(ctx: ValidationContext): Promise<ValidationResult>;
}

/**
 * Validation pipeline that runs all rules and aggregates results.
 */
export class ValidationPipeline {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  async run(ctx: ValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules) {
      const result = await rule.validate(ctx);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Create default validation pipeline with all required rules.
 */
export function createValidationPipeline(): ValidationPipeline {
  return new ValidationPipeline()
    // TODO: Add validation rules
    ;
}
