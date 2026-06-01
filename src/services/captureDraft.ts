import type { CaptureLocation } from '@/services/locationService';

export type CaptureDraft = {
  photoUri: string;
  location: CaptureLocation;
  capturedAt: string;
};

let currentCaptureDraft: CaptureDraft | null = null;

export function setCaptureDraft(draft: CaptureDraft): void {
  currentCaptureDraft = draft;
}

export function getCaptureDraft(): CaptureDraft | null {
  return currentCaptureDraft;
}

export function clearCaptureDraft(): void {
  currentCaptureDraft = null;
}
