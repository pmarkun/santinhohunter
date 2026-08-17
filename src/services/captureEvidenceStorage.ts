import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const DATABASE_NAME = 'santinhohunter-evidence';
const STORE_NAME = 'photos';
const INDEXED_DB_URI = 'indexeddb://';

export async function persistCaptureEvidence(captureId: string, photoUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await fetch(photoUri).then((response) => response.blob());
    const database = await openEvidenceDatabase();
    await runTransaction(database, 'readwrite', (store) => store.put(blob, captureId));
    return `${INDEXED_DB_URI}${captureId}`;
  }

  const directory = new Directory(Paths.document, 'santinho-evidence');
  directory.create({ idempotent: true, intermediates: true });
  const destination = new File(directory, `${captureId}.jpg`);
  await new File(photoUri).copy(destination, { overwrite: true });
  return destination.uri;
}

export async function getCaptureEvidence(uri: string): Promise<Blob> {
  if (uri.startsWith(INDEXED_DB_URI)) {
    const captureId = uri.slice(INDEXED_DB_URI.length);
    const database = await openEvidenceDatabase();
    const value = await runTransaction(database, 'readonly', (store) => store.get(captureId));
    if (!(value instanceof Blob)) throw new Error('Evidência local indisponível');
    return value;
  }
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Evidência local indisponível');
    return response.blob();
  }
  const file = new File(uri);
  if (!file.exists) throw new Error('Evidência local indisponível');
  return file;
}

export async function clearCaptureEvidenceStorage(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof indexedDB === 'undefined') return;
    const database = await openEvidenceDatabase();
    await runTransaction(database, 'readwrite', (store) => store.clear());
    return;
  }
  const directory = new Directory(Paths.document, 'santinho-evidence');
  if (directory.exists) directory.delete();
}

function openEvidenceDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Armazenamento de evidência indisponível'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha no armazenamento local'));
  });
}

function runTransaction<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha no armazenamento local'));
    transaction.oncomplete = () => database.close();
  });
}
