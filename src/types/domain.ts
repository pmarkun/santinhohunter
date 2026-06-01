export type Uf =
  | 'AC'
  | 'AL'
  | 'AP'
  | 'AM'
  | 'BA'
  | 'CE'
  | 'DF'
  | 'ES'
  | 'GO'
  | 'MA'
  | 'MT'
  | 'MS'
  | 'MG'
  | 'PA'
  | 'PB'
  | 'PR'
  | 'PE'
  | 'PI'
  | 'RJ'
  | 'RN'
  | 'RS'
  | 'RO'
  | 'RR'
  | 'SC'
  | 'SP'
  | 'SE'
  | 'TO';

export type Office =
  | 'president'
  | 'governor'
  | 'senator'
  | 'federal_deputy'
  | 'state_deputy'
  | 'district_deputy';

export type CaptureStatus =
  | 'draft'
  | 'processing'
  | 'needs_manual_match'
  | 'confirmed'
  | 'rejected';

export type SyncStatus =
  | 'local_only'
  | 'pending_sync'
  | 'syncing'
  | 'synced'
  | 'sync_failed';

export type Candidate = {
  id: string;
  electionYear: number;
  uf: Uf | 'BR';
  office: Office;
  number: string;
  ballotName: string;
  fullName: string;
  party: string;
  photoUrl?: string;
};

export type CandidateMatch = {
  candidateId: string;
  confidence: number;
  matchType: 'face_vector' | 'number_search' | 'manual_selection' | 'ocr_number';
  rank: number;
};

export type SantinhoCapture = {
  id: string;
  photoUri: string;
  createdAt: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  uf: Uf;
  city?: string;
  candidateMatches: CandidateMatch[];
  selectedCandidateId?: string;
  manualCandidateNumber?: string;
  office?: Office;
  status: CaptureStatus;
  syncStatus: SyncStatus;
};

export type RankingEntry = {
  candidate: Candidate;
  count: number;
  lastCaptureAt: string;
};
