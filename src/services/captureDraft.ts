import type { CaptureLocation } from '@/services/locationService';
import type { Candidate } from '@/types/domain';

export type CaptureDraft = {
  photoUri: string;
  location: CaptureLocation;
  capturedAt: string;
  selectedCandidate?: Candidate;
  selectionType?: 'face_vector' | 'manual_selection';
};

let currentCaptureDraft: CaptureDraft | null = null;

export function setCaptureDraft(draft: CaptureDraft): void {
  currentCaptureDraft = draft;
}

export function getCaptureDraft(): CaptureDraft | null {
  return currentCaptureDraft;
}

export function selectCaptureDraftCandidate(
  candidate: Candidate,
  selectionType: NonNullable<CaptureDraft['selectionType']>,
): CaptureDraft | null {
  if (!currentCaptureDraft) {
    return null;
  }

  currentCaptureDraft = {
    ...currentCaptureDraft,
    selectedCandidate: candidate,
    selectionType,
  };
  return currentCaptureDraft;
}

export function clearCaptureDraft(): void {
  currentCaptureDraft = null;
}
