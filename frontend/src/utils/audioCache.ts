const ENCOURAGEMENT_CACHE_KEY = 'speechmate:encouragement-v1';
export const DEFAULT_ENCOURAGEMENT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface CachedEncouragement {
  message: string;
  audioDataUrl: string;
  timestamp: number;
}

const isBrowser = () => typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

export const storeEncouragementCache = (payload: { message: string; audioDataUrl: string }) => {
  if (!isBrowser()) return;
  const entry: CachedEncouragement = {
    ...payload,
    timestamp: Date.now()
  };
  try {
    sessionStorage.setItem(ENCOURAGEMENT_CACHE_KEY, JSON.stringify(entry));
  } catch (err) {
    console.warn('Unable to cache encouragement audio', err);
  }
};

export const readEncouragementCache = (maxAgeMs = DEFAULT_ENCOURAGEMENT_TTL_MS): CachedEncouragement | null => {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(ENCOURAGEMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEncouragement;
    if (Date.now() - parsed.timestamp > maxAgeMs) {
      sessionStorage.removeItem(ENCOURAGEMENT_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('Unable to read encouragement cache', err);
    return null;
  }
};

export const clearEncouragementCache = () => {
  if (!isBrowser()) return;
  sessionStorage.removeItem(ENCOURAGEMENT_CACHE_KEY);
};

export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
