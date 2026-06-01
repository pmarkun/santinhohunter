const mockAsyncStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    clear: jest.fn(async () => {
      mockAsyncStorage.clear();
    }),
    getItem: jest.fn(async (key: string) => mockAsyncStorage.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      mockAsyncStorage.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      mockAsyncStorage.set(key, value);
    }),
  },
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
