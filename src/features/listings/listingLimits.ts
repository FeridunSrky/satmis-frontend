// Mirrors the backend validation limits in frontend-api.md
const CURRENT_YEAR = new Date().getFullYear();

export const MIN_MODEL_YEAR = 1950;
export const MAX_MODEL_YEAR = CURRENT_YEAR + 1;
export const MAX_KILOMETER = 2_000_000;
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 150;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const COLOR_MAX_LENGTH = 30;
export const MAX_ENGINE_POWER = 2000;
export const MAX_ENGINE_CAPACITY = 10_000;
export const MIN_IMAGES = 1;
export const MAX_IMAGES = 20;
