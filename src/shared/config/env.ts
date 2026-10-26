const FALLBACK_APP_NAME = 'satmis.com';

export const appName = import.meta.env.VITE_APP_NAME?.trim() || FALLBACK_APP_NAME;
