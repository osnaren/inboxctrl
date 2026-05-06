// Validation
export { validateCriteria, validateAction, validateFilter } from './validation';

// Dry-run
export { dryRunFilter } from './dry-run';

// Safety checks
export { checkFilterSafety, isBroadFilter } from './safety';

// Conflict detection (basic OSS)
export { detectBasicConflicts } from './conflicts';

// Types
export type {
  ConflictCheckResult,
  DryRunEmail,
  DryRunMatchExplanation,
  DryRunResult,
  ExtendedFilterCriteria,
  FilterConflict,
  SafetyCheckInput,
  SafetyCheckOutput,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types';
