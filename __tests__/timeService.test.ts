import { formatRelativeTime } from '@/services/timeService';

describe('timeService', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('formats recent captures as a short relative time', () => {
    expect(formatRelativeTime('2026-06-01T11:45:00.000Z', now)).toBe('há 15 min');
    expect(formatRelativeTime('2026-06-01T10:00:00.000Z', now)).toBe('há 2 h');
    expect(formatRelativeTime('2026-05-30T12:00:00.000Z', now)).toBe('há 2 d');
  });

  it('uses a friendly label for captures under one minute', () => {
    expect(formatRelativeTime('2026-06-01T11:59:40.000Z', now)).toBe('há pouco');
  });
});
