export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_SANTINHO_API_BASE_URL ?? 'http://127.0.0.1:8011';
}
