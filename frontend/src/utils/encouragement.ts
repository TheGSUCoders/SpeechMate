import axios from 'axios';
import { blobToDataUrl, readEncouragementCache, storeEncouragementCache, type CachedEncouragement } from './audioCache';

const DEFAULT_TIMEOUT = 15000;

export const ensureEncouragementReady = async (
  apiBaseUrl: string,
  userName: string
): Promise<CachedEncouragement | null> => {
  const cached = readEncouragementCache();
  if (cached) {
    return cached;
  }
  return fetchAndCacheEncouragement(apiBaseUrl, userName);
};

export const fetchAndCacheEncouragement = async (
  apiBaseUrl: string,
  userName: string
): Promise<CachedEncouragement | null> => {
  try {
    const encouragementResponse = await axios.post(
      `${apiBaseUrl}/api/gemini/generate-encouragement`,
      { userName },
      { withCredentials: true }
    );

    const message = encouragementResponse.data?.message || `You got this, ${userName}!`;

    const audioResponse = await axios.post(
      `${apiBaseUrl}/api/elevenlabs/text-to-speech`,
      { text: message },
      {
        withCredentials: true,
        responseType: 'blob',
        timeout: DEFAULT_TIMEOUT
      }
    );

    const audioDataUrl = await blobToDataUrl(audioResponse.data);
    storeEncouragementCache({ message, audioDataUrl });
    return {
      message,
      audioDataUrl,
      timestamp: Date.now()
    };
  } catch (err) {
    console.error('Failed to fetch encouragement audio', err);
    return null;
  }
};
