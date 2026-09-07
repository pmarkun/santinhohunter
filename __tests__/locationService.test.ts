import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { detectCurrentUf, getCaptureLocation } from '@/services/locationService';
import { saveStoredUf } from '@/services/ufService';

const requestPermission = jest.mocked(Location.requestForegroundPermissionsAsync);
const getPosition = jest.mocked(Location.getCurrentPositionAsync);
const reverseGeocode = jest.mocked(Location.reverseGeocodeAsync);

describe('locationService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('keeps the selected UF when location permission is denied', async () => {
    await saveStoredUf('SC');
    requestPermission.mockResolvedValue({ status: 'denied' } as Location.LocationPermissionResponse);

    await expect(getCaptureLocation('SC')).resolves.toEqual({ uf: 'SC' });
  });

  it('keeps the selected UF while attaching coordinates and city', async () => {
    await saveStoredUf('SC');
    requestPermission.mockResolvedValue({ status: 'granted' } as Location.LocationPermissionResponse);
    getPosition.mockResolvedValue({
      coords: { accuracy: 20, latitude: -27.59, longitude: -48.55 },
    } as Location.LocationObject);
    reverseGeocode.mockResolvedValue([
      { city: 'Florianópolis', region: 'Santa Catarina' } as Location.LocationGeocodedAddress,
    ]);

    await expect(getCaptureLocation('SC')).resolves.toEqual({
      accuracy: 20,
      city: 'Florianópolis',
      latitude: -27.59,
      longitude: -48.55,
      uf: 'SC',
    });
  });

  it('detects a UF from the full state name only when explicitly requested', async () => {
    requestPermission.mockResolvedValue({ status: 'granted' } as Location.LocationPermissionResponse);
    getPosition.mockResolvedValue({
      coords: { accuracy: 20, latitude: -27.59, longitude: -48.55 },
    } as Location.LocationObject);
    reverseGeocode.mockResolvedValue([
      { city: 'Florianópolis', region: 'Santa Catarina' } as Location.LocationGeocodedAddress,
    ]);

    await expect(detectCurrentUf()).resolves.toBe('SC');
  });
});
