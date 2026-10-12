import { describe, expect, it } from 'vitest';
import { ApiError, buildUrl, errorMessage, toApiError } from './client';

describe('buildUrl', () => {
  it('returns the path unchanged when there is no query', () => {
    expect(buildUrl('/api/v1/jobs')).toBe('/api/v1/jobs');
  });

  it('appends only the parameters that have a value', () => {
    const url = buildUrl('/api/v1/jobs', { q: 'java', remote: true, limit: 20, location: '', source: null, cursor: undefined });
    // empty string, null and undefined are dropped so they never become "?location="
    expect(url).toBe('/api/v1/jobs?q=java&remote=true&limit=20');
  });

  it('encodes special characters', () => {
    expect(buildUrl('/api/v1/jobs', { q: 'c++ & spring' })).toBe('/api/v1/jobs?q=c%2B%2B+%26+spring');
  });

  it('keeps 0 and false, which are real values', () => {
    expect(buildUrl('/x', { minScore: 0, remote: false })).toBe('/x?minScore=0&remote=false');
  });
});

describe('toApiError', () => {
  it('reads RFC 9457 problem details, including field errors', async () => {
    const res = new Response(JSON.stringify({ title: 'Validation failed', detail: 'One or more fields are invalid.', errors: { email: 'must be valid' } }),
      { status: 400 });
    const err = await toApiError(res);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.title).toBe('Validation failed');
    expect(err.field('email')).toBe('must be valid');
  });

  it('uses the body text when a non-JSON error has one', async () => {
    const err = await toApiError(new Response('boom', { status: 500 }));
    expect(err.status).toBe(500);
    expect(err.message).toBe('boom');
  });

  it('falls back to a readable message for an empty 500 body', async () => {
    const err = await toApiError(new Response('', { status: 500 }));
    expect(err.message).toBe('The server had a problem.');
  });
});

describe('errorMessage', () => {
  it('uses the ApiError detail', () => {
    expect(errorMessage(new ApiError(404, 'Not found', 'No such job.'))).toBe('No such job.');
  });

  it('handles unknown throwables', () => {
    expect(errorMessage('weird')).toBe('Something went wrong.');
  });
});
