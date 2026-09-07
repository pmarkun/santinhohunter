import * as Location from 'expo-location';

import { normalizeUf } from '@/services/ufService';
import type { Uf } from '@/types/domain';

export type CaptureLocation = {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  uf: Uf;
  city?: string;
};

type ResolvedLocation = {
  address?: Location.LocationGeocodedAddress;
  position: Location.LocationObject;
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

async function resolveCurrentLocation(): Promise<ResolvedLocation> {
  const permission = await withTimeout(Location.requestForegroundPermissionsAsync(), 5000);

  if (permission.status !== 'granted') {
    throw new Error('Location permission denied');
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

  return {
    position,
    ...(address ? { address } : {}),
  };
}

export async function detectCurrentUf(): Promise<Uf> {
  const { address } = await resolveCurrentLocation();
  const detectedUf = normalizeUf(address?.region);
  if (!detectedUf) {
    throw new Error('Não consegui identificar seu estado pela localização.');
  }

  return detectedUf;
}

export async function getCaptureLocation(selectedUf: Uf): Promise<CaptureLocation> {
  let resolved: ResolvedLocation;
  try {
    resolved = await resolveCurrentLocation();
  } catch {
    return { uf: selectedUf };
  }

  const { address, position } = resolved;

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    uf: selectedUf,
    ...(position.coords.accuracy === null ? {} : { accuracy: position.coords.accuracy }),
    ...(address?.city ? { city: address.city } : {}),
  };
}
