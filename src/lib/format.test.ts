import { describe, expect, it } from 'vitest';
import { bytes, humanize, inr, percent, salary, splitList, timeAgo } from './format';
import { SseParser } from '../api/sse';
import { buildUrl } from '../api/client';

describe('format', () => {
  it('formats money the Indian way', () => {
    expect(inr(1200000)).toBe('₹12,00,000');
    expect(inr(null)).toBe('—');
  });

  it('shows salary ranges and single values', () => {
    expect(salary(50000, 70000, 'EUR')).toBe('EUR 50,000 – 70,000');
    expect(salary(null, 900000, 'INR')).toBe('INR 9,00,000');
    expect(salary(null, null, null)).toBeNull();
  });

  it('tells how long ago', () => {
    const now = Date.parse('2026-10-05T12:00:00Z');
    expect(timeAgo('2026-10-05T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-10-05T10:00:00Z', now)).toBe('2 hours ago');
    expect(timeAgo('2026-10-03T12:00:00Z', now)).toBe('2 days ago');
    expect(timeAgo(null, now)).toBe('—');
  });

  it('humanizes enum names and splits lists', () => {
    expect(humanize('NEEDS_YOU')).toBe('Needs you');
    expect(humanize('fullName')).toBe('Full name');
    expect(humanize('noticePeriodDays')).toBe('Notice period days');
    expect(splitList('Java, java ,  Spring Boot,\n,Kafka')).toEqual(['Java', 'Spring Boot', 'Kafka']);
    expect(bytes(2048)).toBe('2.0 KB');
    expect(percent(0.756, 1)).toBe('75.6%');
  });
});

describe('SseParser', () => {
  it('parses events split across chunks and skips keep-alives', () => {
    const parser = new SseParser();
    expect(parser.push('event: connected\ndata: {"userId"')).toEqual([]);
    expect(parser.push(':"u1"}\n\n: keep-alive\n\nevent: application-updated\ndata: {"a":1}\n\n')).toEqual([
      { event: 'connected', data: '{"userId":"u1"}' },
      { event: 'application-updated', data: '{"a":1}' },
    ]);
  });

  it('joins multi-line data', () => {
    expect(new SseParser().push('data: one\r\ndata: two\r\n\r\n')).toEqual([{ event: 'message', data: 'one\ntwo' }]);
  });
});

describe('buildUrl', () => {
  it('drops empty values', () => {
    expect(buildUrl('/api/v1/jobs', { q: 'java', remote: false, cursor: null, location: '' })).toBe(
      '/api/v1/jobs?q=java&remote=false',
    );
  });
});
