import type { CaptureLocation } from '@/services/locationService';
import type { Candidate } from '@/types/domain';

export type CaptureDraft = {
  photoUri: string;
  previewUri?: string;
  location: CaptureLocation;
  capturedAt: string;
  selectedCandidate?: Candidate;
  selectionType?: 'face_vector' | 'manual_selection';
  activeFaceId?: string;
  selectedCandidates?: CaptureDraftCandidateSelection[];
};

export type CaptureDraftCandidateSelection = {
  faceId: string;
  candidate: Candidate;
  selectionType: 'face_vector' | 'manual_selection';
  confidence?: number;
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
  faceId = currentCaptureDraft?.activeFaceId ?? 'face-0',
  confidence?: number,
): CaptureDraft | null {
  if (!currentCaptureDraft) {
    return null;
  }

  const nextSelection: CaptureDraftCandidateSelection = {
    faceId,
    candidate,
    selectionType,
    ...(confidence !== undefined ? { confidence } : {}),
  };
  const selectedCandidates = [
    ...(currentCaptureDraft.selectedCandidates ?? []).filter(
      (selection) => selection.faceId !== faceId,
    ),
    nextSelection,
  ];

  currentCaptureDraft = {
    ...currentCaptureDraft,
    selectedCandidate: candidate,
    selectionType,
    selectedCandidates,
  };
  return currentCaptureDraft;
}

export function setCaptureDraftActiveFace(faceId: string): CaptureDraft | null {
  if (!currentCaptureDraft) {
    return null;
  }
  currentCaptureDraft = { ...currentCaptureDraft, activeFaceId: faceId };
  return currentCaptureDraft;
}

export function removeCaptureDraftFaceSelection(faceId: string): CaptureDraft | null {
  if (!currentCaptureDraft) {
    return null;
  }
  currentCaptureDraft = {
    ...currentCaptureDraft,
    selectedCandidates: (currentCaptureDraft.selectedCandidates ?? []).filter(
      (selection) => selection.faceId !== faceId,
    ),
  };
  return currentCaptureDraft;
}

export function clearCaptureDraft(): void {
  currentCaptureDraft = null;
}
