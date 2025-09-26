import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm Hook', () => {
  // Basic initialization and functionality
  test('initializes with correct values and functions', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    // Check initial state
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    
    // Check functions exist
    expect(typeof result.current.handleChange).toBe('function');
    expect(typeof result.current.handleBlur).toBe('function');
    expect(typeof result.current.handleSubmit).toBe('function');
    expect(typeof result.current.setFieldValue).toBe('function');
    expect(typeof result.current.resetForm).toBe('function');
  });

  // Value updates
  test('updates values when handleChange is called', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    // Update name field
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    // Check updated values
    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.values.email).toBe('');

    // Update email field
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });
    });

    // Check both fields are updated
    expect(result.current.values).toEqual({ 
      name: 'John Doe', 
      email: 'john@example.com' 
    });
  });

  // Validation - Required fields
  test('validates required fields on blur', () => {
    const initialValues = { name: '', email: '' };
    const validationRules = {
      name: { required: true, message: 'Name is required' },
      email: { required: true, message: 'Email is required' }
    };

    const { result } = renderHook(() => 
      useForm(initialValues, validationRules)
    );

    // Trigger blur on empty name field
    act(() => {
      result.current.handleBlur({
        target: { name: 'name', value: '' }
      });
    });

    // Check error is set
    expect(result.current.errors.name).toBe('Name is required');
    expect(result.current.touched.name).toBe(true);

    // Fill the name field and blur again
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
      result.current.handleBlur({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    // Check error is cleared
    expect(result.current.errors.name).toBeUndefined();
  });

  // Validation - Pattern validation
  test('validates patterns on blur', () => {
    const initialValues = { email: '' };
    const validationRules = {
      email: {
        required: true,
        message: 'Email is required',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Invalid email format'
      }
    };

    const { result } = renderHook(() => 
      useForm(initialValues, validationRules)
    );

    // Enter invalid email and blur
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'invalid-email' }
      });
      result.current.handleBlur({
        target: { name: 'email', value: 'invalid-email' }
      });
    });

    // Check pattern error
    expect(result.current.errors.email).toBe('Invalid email format');

    // Enter valid email and blur
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'valid@example.com' }
      });
      result.current.handleBlur({
        target: { name: 'email', value: 'valid@example.com' }
      });
    });

    // Check error is cleared
    expect(result.current.errors.email).toBeUndefined();
  });

  // Validation - Min length
  test('validates minimum length on blur', () => {
    const initialValues = { password: '' };
    const validationRules = {
      password: {
        required: true,
        message: 'Password is required',
        minLength: 6,
        minLengthMessage: 'Password must be at least 6 characters'
      }
    };

    const { result } = renderHook(() => 
      useForm(initialValues, validationRules)
    );

    // Enter short password and blur
    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: '12345' }
      });
      result.current.handleBlur({
        target: { name: 'password', value: '12345' }
      });
    });

    // Check min length error
    expect(result.current.errors.password).toBe('Password must be at least 6 characters');

    // Enter valid password and blur
    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: '123456' }
      });
      result.current.handleBlur({
        target: { name: 'password', value: '123456' }
      });
    });

    // Check error is cleared
    expect(result.current.errors.password).toBeUndefined();
  });

  // Form submission with validation
  test('validates all fields on form submission', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules = {
      name: { required: true, message: 'Name is required' },
      email: { required: true, message: 'Email is required' }
    };

    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm(initialValues, validationRules, onSubmit)
    );

    // Submit empty form
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    // Check all fields are validated
    expect(result.current.errors).toEqual({
      name: 'Name is required',
      email: 'Email is required'
    });
    
    // Check all fields are marked as touched
    expect(result.current.touched).toEqual({
      name: true,
      email: true
    });
    
    // Check onSubmit was not called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Successful form submission
  test('calls onSubmit with form values when validation passes', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules = {
      name: { required: true, message: 'Name is required' },
      email: { required: true, message: 'Email is required' }
    };

    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm(initialValues, validationRules, onSubmit)
    );

    // Fill out the form
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });
    });

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    // Check onSubmit was called with correct values
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  // Submission state management
  test('sets and resets isSubmitting state during form submission', async () => {
    const initialValues = { name: 'John Doe', email: 'john@example.com' };
    
    // Create a delayed submission function
    const onSubmit = jest.fn(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));
    
    const { result } = renderHook(() => 
      useForm(initialValues, null, onSubmit)
    );

    // Start submission
    let submitPromise;
    act(() => {
      submitPromise = result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    // Check isSubmitting is true during submission
    expect(result.current.isSubmitting).toBe(true);

    // Wait for submission to complete
    await act(async () => {
      await submitPromise;
    });

    // Check isSubmitting is reset to false
    expect(result.current.isSubmitting).toBe(false);
  });

  // Field value setter
  test('setFieldValue updates a specific field value', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    // Set field value directly
    act(() => {
      result.current.setFieldValue('name', 'John Doe');
    });

    // Check value is updated
    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.values.email).toBe('');
  });

  // Form reset
  test('resetForm restores initial values and clears errors/touched state', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    // Change values and create errors/touched state
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
      result.current.handleBlur({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.touched.name).toBe(true);

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    // Check everything is reset
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  // Custom validators
  test('applies custom validators on blur and submission', async () => {
    const initialValues = { password: '', confirmPassword: '' };
    const customValidators = {
      confirmPassword: (value, values) => {
        if (value && value !== values.password) {
          return 'Passwords do not match';
        }
        return '';
      }
    };

    const { result } = renderHook(() => 
      useForm(initialValues, null, null, customValidators)
    );

    // Set password and confirmPassword to different values
    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'password123' }
      });
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password456' }
      });
      result.current.handleBlur({
        target: { name: 'confirmPassword', value: 'password456' }
      });
    });

    // Check custom validator error
    expect(result.current.errors.confirmPassword).toBe('Passwords do not match');

    // Set matching passwords
    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password123' }
      });
      result.current.handleBlur({
        target: { name: 'confirmPassword', value: 'password123' }
      });
    });

    // Check error is cleared
    expect(result.current.errors.confirmPassword).toBeUndefined();
  });
  
  // Form submission with custom validation
  test('validates with custom validators on submission', async () => {
    const initialValues = { password: 'password123', confirmPassword: 'wrong' };
    const customValidators = {
      confirmPassword: (value, values) => {
        if (value !== values.password) {
          return 'Passwords do not match';
        }
        return '';
      }
    };
    
    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm(initialValues, null, onSubmit, customValidators)
    );
    
    // Submit form with mismatched passwords
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });
    
    // Check custom validation error
    expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
    expect(onSubmit).not.toHaveBeenCalled();
    
    // Fix the password and submit again
    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password123' }
      });
    });
    
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });
    
    // Check submission succeeds
    expect(result.current.errors.confirmPassword).toBeUndefined();
    expect(onSubmit).toHaveBeenCalledWith({
      password: 'password123',
      confirmPassword: 'password123'
    });
  });
});