import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm Hook', () => {
  describe('Initialization', () => {
    it('initializes with correct default values', () => {
      const initialValues = { name: '', email: '', age: 0 };
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('provides all expected methods', () => {
      const { result } = renderHook(() => useForm({}));

      expect(typeof result.current.handleChange).toBe('function');
      expect(typeof result.current.handleBlur).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.resetForm).toBe('function');
      expect(typeof result.current.setValues).toBe('function');
      expect(typeof result.current.setFieldValue).toBe('function');
    });
  });

  describe('Input Handling', () => {
    it('updates values on handleChange', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John Doe' }
        });
      });

      expect(result.current.values.name).toBe('John Doe');
      expect(result.current.values.email).toBe('');
    });

    it('handles multiple field changes', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '', city: '' }));

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John' }
        });
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'john@example.com' }
        });
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'city', value: 'New York' }
        });
      });

      expect(result.current.values).toEqual({
        name: 'John',
        email: 'john@example.com',
        city: 'New York'
      });
    });

    it('marks fields as touched on handleBlur', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      act(() => {
        result.current.handleBlur({
          target: { name: 'name' }
        });
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBeUndefined();
    });
  });

  describe('Validation - Rules Object', () => {
    it('validates required fields', async () => {
      const rules = { 
        name: { required: true },
        email: { required: true }
      };
      const { result } = renderHook(() => useForm({ name: '', email: '' }, rules));

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
      });

      await waitFor(() => {
        expect(result.current.errors.name).toBe('name is required');
      });
    });

    it('validates required fields with custom messages', async () => {
      const rules = { 
        name: { required: true, message: 'Name is mandatory' }
      };
      const { result } = renderHook(() => useForm({ name: '' }, rules));

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
      });

      await waitFor(() => {
        expect(result.current.errors.name).toBe('Name is mandatory');
      });
    });

    it('validates pattern requirements', async () => {
      const rules = { 
        email: { 
          required: true, 
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          patternMessage: 'Please enter a valid email address'
        }
      };
      const { result } = renderHook(() => useForm({ email: '' }, rules));

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid-email' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'email' } });
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBe('Please enter a valid email address');
      });
    });

    it('validates minimum length', async () => {
      const rules = { 
        password: { 
          required: true,
          minLength: 8,
          minLengthMessage: 'Password must be at least 8 characters'
        }
      };
      const { result } = renderHook(() => useForm({ password: '' }, rules));

      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: '123' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'password' } });
      });

      await waitFor(() => {
        expect(result.current.errors.password).toBe('Password must be at least 8 characters');
      });
    });

    it('validates maximum length', async () => {
      const rules = { 
        username: { 
          maxLength: 10,
          maxLengthMessage: 'Username cannot exceed 10 characters'
        }
      };
      const { result } = renderHook(() => useForm({ username: '' }, rules));

      act(() => {
        result.current.handleChange({
          target: { name: 'username', value: 'verylongusername' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'username' } });
      });

      await waitFor(() => {
        expect(result.current.errors.username).toBe('Username cannot exceed 10 characters');
      });
    });

    it('clears validation errors when field becomes valid', async () => {
      const rules = { 
        email: { 
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      };
      const { result } = renderHook(() => useForm({ email: '' }, rules));

      // First, create an error
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'email' } });
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBeTruthy();
      });

      // Then fix the error
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'valid@example.com' }
        });
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBeUndefined();
      });
    });
  });

  describe('Custom Validators', () => {
    it('applies custom validators', async () => {
      const customValidators = {
        age: (value) => {
          if (value < 18) return 'Must be 18 or older';
          return null;
        }
      };
      
      const { result } = renderHook(() => 
        useForm({ age: 0 }, null, null, customValidators)
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'age', value: '15' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'age' } });
      });

      await waitFor(() => {
        expect(result.current.errors.age).toBe('Must be 18 or older');
      });
    });

    it('custom validators override built-in rules', async () => {
      const rules = { age: { required: true } };
      const customValidators = {
        age: (value) => {
          if (value && value < 21) return 'Must be 21 or older';
          return null;
        }
      };
      
      const { result } = renderHook(() => 
        useForm({ age: 0 }, rules, null, customValidators)
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'age', value: '18' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'age' } });
      });

      await waitFor(() => {
        expect(result.current.errors.age).toBe('Must be 21 or older');
      });
    });

    it('receives both field value and all form values in custom validator', async () => {
      const customValidators = {
        confirmEmail: (value, allValues) => {
          if (value !== allValues.email) return 'Email addresses do not match';
          return null;
        }
      };
      
      const { result } = renderHook(() => 
        useForm({ email: '', confirmEmail: '' }, null, null, customValidators)
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' }
        });
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'confirmEmail', value: 'different@example.com' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'confirmEmail' } });
      });

      await waitFor(() => {
        expect(result.current.errors.confirmEmail).toBe('Email addresses do not match');
      });
    });
  });

  describe('Password Confirmation', () => {
    it('validates password confirmation automatically', async () => {
      const { result } = renderHook(() => 
        useForm({ password: '', confirmPassword: '' })
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: 'password123' }
        });
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'different' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'confirmPassword' } });
      });

      await waitFor(() => {
        expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
      });
    });

    it('clears password confirmation error when passwords match', async () => {
      const { result } = renderHook(() => 
        useForm({ password: '', confirmPassword: '' })
      );

      // Create mismatch first
      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: 'password123' }
        });
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'different' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'confirmPassword' } });
      });

      await waitFor(() => {
        expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
      });

      // Fix the mismatch
      act(() => {
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'password123' }
        });
      });

      await waitFor(() => {
        expect(result.current.errors.confirmPassword).toBeUndefined();
      });
    });
  });

  describe('Form Submission', () => {
    it('prevents submission with validation errors', async () => {
      const onSubmit = vi.fn();
      const rules = { name: { required: true } };
      
      const { result } = renderHook(() => 
        useForm({ name: '' }, rules, onSubmit)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.name).toBe('name is required');
    });

    it('calls onSubmit when validation passes', async () => {
      const onSubmit = vi.fn().mockResolvedValue();
      
      const { result } = renderHook(() => 
        useForm({ name: 'John' }, null, onSubmit)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
    });

    it('sets all fields as touched on submission', async () => {
      const onSubmit = vi.fn();
      
      const { result } = renderHook(() => 
        useForm({ name: '', email: '', city: '' }, null, onSubmit)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(result.current.touched).toEqual({
        name: true,
        email: true,
        city: true
      });
    });

    it('manages isSubmitting state during async submission', async () => {
      let resolveSubmit;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      const onSubmit = vi.fn(() => submitPromise);
      
      const { result } = renderHook(() => 
        useForm({ name: 'John' }, null, onSubmit)
      );

      expect(result.current.isSubmitting).toBe(false);

      // Start submission without awaiting
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      // Should be submitting immediately after calling handleSubmit
      expect(result.current.isSubmitting).toBe(true);

      // Resolve the submission
      act(() => {
        resolveSubmit();
      });

      // Wait for the submission to complete
      await act(async () => {
        await submitPromise;
      });

      // Should not be submitting after completion
      expect(result.current.isSubmitting).toBe(false);
    });

    it('handles submission errors gracefully', async () => {
      const error = new Error('Submission failed');
      const onSubmit = vi.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => 
        useForm({ name: 'John' }, null, onSubmit)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(result.current.errors.form).toBe('Submission failed');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('accepts submit handler as parameter', async () => {
      const defaultSubmit = vi.fn();
      const paramSubmit = vi.fn().mockResolvedValue();
      
      const { result } = renderHook(() => 
        useForm({ name: 'John' }, null, defaultSubmit)
      );

      await act(async () => {
        await result.current.handleSubmit(paramSubmit);
      });

      expect(paramSubmit).toHaveBeenCalledWith({ name: 'John' });
      expect(defaultSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('resets form to initial state', () => {
      const initialValues = { name: 'Initial', email: 'test@example.com' };
      const { result } = renderHook(() => useForm(initialValues));

      // Make changes
      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'Changed' }
        });
      });

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('sets specific field value with setFieldValue', () => {
      const { result } = renderHook(() => useForm({ name: '', age: 0 }));

      act(() => {
        result.current.setFieldValue('name', 'New Name');
      });

      act(() => {
        result.current.setFieldValue('age', 25);
      });

      expect(result.current.values.name).toBe('New Name');
      expect(result.current.values.age).toBe(25);
    });

    it('sets all values with setValues', () => {
      const { result } = renderHook(() => useForm({ name: '', email: '' }));

      act(() => {
        result.current.setValues({ name: 'John', email: 'john@example.com' });
      });

      expect(result.current.values).toEqual({
        name: 'John',
        email: 'john@example.com'
      });
    });
  });

  describe('Function Validation', () => {
    it('works with function-based validation', async () => {
      const validateForm = (values) => {
        const errors = {};
        if (!values.email) {
          errors.email = 'Email is required';
        }
        if (values.email && !values.email.includes('@')) {
          errors.email = 'Invalid email format';
        }
        return errors;
      };

      const { result } = renderHook(() => 
        useForm({ email: '' }, validateForm)
      );

      act(() => {
        result.current.handleBlur({ target: { name: 'email' } });
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBe('Email is required');
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid' }
        });
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBe('Invalid email format');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string values in validation', async () => {
      const rules = { name: { required: true } };
      const { result } = renderHook(() => useForm({ name: '   ' }, rules));

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
      });

      await waitFor(() => {
        expect(result.current.errors.name).toBe('name is required');
      });
    });

    it('handles numeric fields correctly', async () => {
      const rules = { 
        age: { 
          required: true,
          minLength: 1
        }
      };
      const { result } = renderHook(() => useForm({ age: 0 }, rules));

      act(() => {
        result.current.handleChange({
          target: { name: 'age', value: 25 }
        });
      });

      expect(result.current.values.age).toBe(25);
    });

    it('skips validation for non-required empty fields', async () => {
      const rules = { 
        optional: { 
          minLength: 5,
          minLengthMessage: 'Must be at least 5 characters'
        }
      };
      const { result } = renderHook(() => useForm({ optional: '' }, rules));

      act(() => {
        result.current.handleBlur({ target: { name: 'optional' } });
      });

      // Should not validate minLength for empty non-required field
      await waitFor(() => {
        expect(result.current.errors.optional).toBeUndefined();
      });
    });
  });
});
