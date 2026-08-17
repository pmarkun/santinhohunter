import { Platform } from 'react-native';

export const fontFamilies = {
  display: Platform.select({
    android: 'sans-serif-condensed',
    default: 'System',
    web: 'Arial Narrow, Arial, sans-serif',
  }),
  body: Platform.select({
    default: 'System',
    web: 'Arial, sans-serif',
  }),
} as const;

export const type = {
  title: 36,
  subtitle: 20,
  body: 16,
  small: 13,
  counter: 52,
} as const;
