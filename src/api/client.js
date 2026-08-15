import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { createLocalApi } from './localClient';

const useLocal =
  import.meta.env.VITE_LOCAL_BACKEND === 'true' ||
  import.meta.env.VITE_PREVIEW_MODE === 'true';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const api = useLocal
  ? createLocalApi()
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    });
