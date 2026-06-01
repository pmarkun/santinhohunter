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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Location request timed out'));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

export async function getCaptureLocation(): Promise<CaptureLocation> {
  const permission = await withTimeout(Location.requestForegroundPermissionsAsync(), 5000);

  if (permission.status !== 'granted') {
    return { uf: getDefaultUf() };
  }

  const position = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    7000,
  );

  const [address] = await withTimeout(
    Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
    4000,
  ).catch(() => []);

  const uf = normalizeUf(address?.region) ?? getDefaultUf();

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    uf,
    ...(position.coords.accuracy === null ? {} : { accuracy: position.coords.accuracy }),
    ...(address?.city ? { city: address.city } : {}),
  };
}
