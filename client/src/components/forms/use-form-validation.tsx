/**
 * useFormValidation Hook
 * Custom hook for handling form validation with Zod schemas
 */

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { FormValidationReturn } from './types';

interface UseFormValidationOptions {
  schema?: z.ZodSchema<any>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export function useFormValidation({
  schema,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions = {}): FormValidationReturn {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Validate a single field
  const validateField = useCallback(
    (field: string, value: any): boolean => {
      if (!schema) return true;

      try {
        // For field validation, we'll validate the entire object and extract field-specific errors
        const testData = { [field]: value };
        schema.parse(testData);
        // Clear field errors if validation passes
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.errors
            .filter(err => err.path.includes(field))
            .map(err => err.message);

          if (fieldErrors.length > 0) {
            setErrors(prev => ({
              ...prev,
              [field]: fieldErrors,
            }));
            return false;
          }
        }
      }
      return true;
    },
    [schema]
  );

  // Validate all fields
  const validateAll = useCallback(
    (data: any): boolean => {
      if (!schema) {
        setIsValid(true);
        return true;
      }

      try {
        schema.parse(data);
        setErrors({});
        setIsValid(true);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string[]> = {};

          error.errors.forEach(err => {
            const field = err.path.join('.');
            if (!newErrors[field]) {
              newErrors[field] = [];
            }
            newErrors[field].push(err.message);
          });

          setErrors(newErrors);
          setIsValid(false);
          return false;
        }
      }
      return false;
    },
    [schema]
  );

  // Debounced validation
  const validateWithDebounce = useCallback(
    (field: string, value: any) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        validateField(field, value);
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [validateField, debounceMs, debounceTimer]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  // Set error for a specific field
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: [error],
    }));
    setIsValid(false);
  }, []);

  // Get errors for a specific field
  const getFieldErrors = useCallback(
    (field: string): string[] => {
      return errors[field] || [];
    },
    [errors]
  );

  // Check if a specific field has errors
  const hasFieldError = useCallback(
    (field: string): boolean => {
      return Boolean(errors[field] && errors[field].length > 0);
    },
    [errors]
  );

  // Get the first error for a field
  const getFirstFieldError = useCallback(
    (field: string): string | undefined => {
      const fieldErrors = getFieldErrors(field);
      return fieldErrors.length > 0 ? fieldErrors[0] : undefined;
    },
    [getFieldErrors]
  );

  // Validate on change handler
  const createChangeHandler = useCallback(
    (field: string, onChange?: (value: any) => void) => {
      return (value: any) => {
        onChange?.(value);
        if (validateOnChange) {
          if (debounceMs > 0) {
            validateWithDebounce(field, value);
          } else {
            validateField(field, value);
          }
        }
      };
    },
    [validateOnChange, validateField, validateWithDebounce, debounceMs]
  );

  // Validate on blur handler
  const createBlurHandler = useCallback(
    (field: string, onBlur?: () => void) => {
      return (value: any) => {
        onBlur?.();
        if (validateOnBlur) {
          validateField(field, value);
        }
      };
    },
    [validateOnBlur, validateField]
  );

  return {
    errors,
    isValid,
    validateField,
    validateAll,
    clearErrors,
    setFieldError,
  };
}

/**
 * useFieldValidation Hook
 * Simplified hook for validating individual fields
 */
export function useFieldValidation(fieldSchema?: z.ZodSchema<any>) {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback(
    (value: any): boolean => {
      if (!fieldSchema) {
        setIsValid(true);
        setError(null);
        return true;
      }

      try {
        fieldSchema.parse(value);
        setIsValid(true);
        setError(null);
        return true;
      } catch (err) {
        if (err instanceof z.ZodError) {
          const firstError = err.errors[0]?.message || 'Invalid value';
          setError(firstError);
          setIsValid(false);
          return false;
        }
      }
      return false;
    },
    [fieldSchema]
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsValid(true);
  }, []);

  return {
    error,
    isValid,
    validate,
    clearError,
  };
}

/**
 * useAsyncValidation Hook
 * For handling asynchronous validation (e.g., checking if email exists)
 */
export function useAsyncValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [asyncErrors, setAsyncErrors] = useState<Record<string, string>>({});

  const validateAsync = useCallback(
    async (
      field: string,
      value: any,
      validator: (value: any) => Promise<boolean | string>
    ) => {
      setIsValidating(true);

      try {
        const result = await validator(value);

        if (result === true) {
          // Validation passed
          setAsyncErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        } else if (typeof result === 'string') {
          // Validation failed with custom message
          setAsyncErrors(prev => ({
            ...prev,
            [field]: result,
          }));
        } else {
          // Validation failed with default message
          setAsyncErrors(prev => ({
            ...prev,
            [field]: 'Validation failed',
          }));
        }
      } catch (error) {
        setAsyncErrors(prev => ({
          ...prev,
          [field]: 'Validation error occurred',
        }));
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const clearAsyncError = useCallback((field: string) => {
    setAsyncErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllAsyncErrors = useCallback(() => {
    setAsyncErrors({});
  }, []);

  return {
    isValidating,
    asyncErrors,
    validateAsync,
    clearAsyncError,
    clearAllAsyncErrors,
  };
}
