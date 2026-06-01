export function formatRelativeTime(isoDate: string, now = new Date()): string {
  const then = new Date(isoDate);
  const diffMs = Math.max(0, now.getTime() - then.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'há pouco';
  }

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `há ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} d`;
}
