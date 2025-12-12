import { describe, it, expect } from 'vitest';

// Note: These are integration-style tests that verify the API service exists and is properly structured
// Full API testing should be done with integration tests or by mocking fetch at a higher level

describe('tenderAPI', () => {
  it('should export tenderAPI object', async () => {
    const { tenderAPI } = await import('../api');
    expect(tenderAPI).toBeDefined();
  });

  it('should have getTenders method', async () => {
    const { tenderAPI } = await import('../api');
    expect(typeof tenderAPI.getTenders).toBe('function');
  });

  it('should have getTender method', async () => {
    const { tenderAPI } = await import('../api');
    expect(typeof tenderAPI.getTender).toBe('function');
  });

  it('should have createTender method', async () => {
    const { tenderAPI } = await import('../api');
    expect(typeof tenderAPI.createTender).toBe('function');
  });

  it('should have updateTender method', async () => {
    const { tenderAPI } = await import('../api');
    expect(typeof tenderAPI.updateTender).toBe('function');
  });

  it('should have deleteTender method', async () => {
    const { tenderAPI } = await import('../api');
    expect(typeof tenderAPI.deleteTender).toBe('function');
  });
});
