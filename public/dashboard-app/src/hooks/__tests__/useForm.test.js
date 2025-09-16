import { renderHook, act } from '@testing-library/react-hooks';
import useForm from '../useForm';

describe('useForm Hook', () => {
  test('initializes with correct values', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(typeof result.current.handleChange).toBe('function');
    expect(typeof result.current.handleBlur).toBe('function');
    expect(typeof result.current.handleSubmit).toBe('function');
    expect(typeof result.current.setFieldValue).toBe('function');
    expect(typeof result.current.resetForm).toBe('function');
  });

  test('updates values on handleChange', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    expect(result.current.values).toEqual({ name: 'John Doe', email: '' });
  });

  test('validates form fields on blur', () => {
    const initialValues = { name: '', email: '' };
    const validationRules = {
      name: { required: true, message: 'Name is required' },
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

    // Test empty field validation
    act(() => {
      result.current.handleBlur({
        target: { name: 'name', value: '' }
      });
    });

    expect(result.current.errors).toEqual({ name: 'Name is required' });

    // Test pattern validation
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'invalid-email' }
      });

      result.current.handleBlur({
        target: { name: 'email', value: 'invalid-email' }
      });
    });

    expect(result.current.errors).toEqual({ 
      name: 'Name is required',
      email: 'Invalid email format'
    });

    // Test valid input clearing errors
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });

      result.current.handleBlur({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    expect(result.current.errors).toEqual({ 
      email: 'Invalid email format'
    });

    // Test valid email
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });

      result.current.handleBlur({
        target: { name: 'email', value: 'john@example.com' }
      });
    });

    expect(result.current.errors).toEqual({});
  });

  test('validates minLength rule', () => {
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

    // Test too short password
    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: '12345' }
      });

      result.current.handleBlur({
        target: { name: 'password', value: '12345' }
      });
    });

    expect(result.current.errors).toEqual({ 
      password: 'Password must be at least 6 characters'
    });

    // Test valid password
    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: '123456' }
      });

      result.current.handleBlur({
        target: { name: 'password', value: '123456' }
      });
    });

    expect(result.current.errors).toEqual({});
  });

  test('handles form submission with validation', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules = {
      name: { required: true, message: 'Name is required' },
      email: { required: true, message: 'Email is required' }
    };

    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm(initialValues, validationRules, onSubmit)
    );

    // Test submission with empty values
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(result.current.errors).toEqual({ 
      name: 'Name is required', 
      email: 'Email is required' 
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // Fill out the form
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });
    });

    // Test successful submission
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(result.current.errors).toEqual({});
    expect(onSubmit).toHaveBeenCalledWith({ 
      name: 'John Doe', 
      email: 'john@example.com' 
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  test('sets isSubmitting state during submission', async () => {
    const initialValues = { name: 'John Doe', email: 'john@example.com' };
    
    // Create a delayed mock submission function
    const onSubmit = jest.fn(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));
    
    const { result } = renderHook(() => 
      useForm(initialValues, {}, onSubmit)
    );

    // Start submission
    let submitPromise;
    act(() => {
      submitPromise = result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    // Check if isSubmitting is true during submission
    expect(result.current.isSubmitting).toBe(true);

    // Wait for submission to complete
    await act(async () => {
      await submitPromise;
    });

    // Check if isSubmitting is reset to false
    expect(result.current.isSubmitting).toBe(false);
  });

  test('setFieldValue updates specific field', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    act(() => {
      result.current.setFieldValue('name', 'John Doe');
    });

    expect(result.current.values).toEqual({ name: 'John Doe', email: '' });
  });

  test('resetForm restores initial values', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    // Change values
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });
    });

    expect(result.current.values).toEqual({ name: 'John Doe', email: 'john@example.com' });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
  });

  test('handles custom validators', () => {
    const initialValues = { password: '', confirmPassword: '' };
    const customValidators = {
      confirmPassword: (value, values) => {
        if (value !== values.password) {
          return 'Passwords do not match';
        }
        return '';
      }
    };

    const { result } = renderHook(() => 
      useForm(initialValues, {}, null, customValidators)
    );

    // Set password
    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'password123' }
      });
    });

    // Set different confirm password
    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password456' }
      });
      
      result.current.handleBlur({
        target: { name: 'confirmPassword', value: 'password456' }
      });
    });

    expect(result.current.errors).toEqual({ 
      confirmPassword: 'Passwords do not match'
    });

    // Set matching confirm password
    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password123' }
      });
      
      result.current.handleBlur({
        target: { name: 'confirmPassword', value: 'password123' }
      });
    });

    expect(result.current.errors).toEqual({});
  });
});