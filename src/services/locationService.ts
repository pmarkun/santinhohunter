import * as Location from 'expo-location';

import { getDefaultUf, normalizeUf } from '@/services/ufService';
import type { Uf } from '@/types/domain';

export type CaptureLocation = {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  uf: Uf;
  city?: string;
};

export async function getCaptureLocation(): Promise<CaptureLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    return { uf: getDefaultUf() };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const [address] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  const uf = normalizeUf(address?.region) ?? getDefaultUf();

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    uf,
    ...(position.coords.accuracy === null ? {} : { accuracy: position.coords.accuracy }),
    ...(address?.city ? { city: address.city } : {}),
  };
}
