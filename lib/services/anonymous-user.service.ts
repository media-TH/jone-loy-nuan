/**
 * 🔐 Anonymous User Service
 *
 * Modern functional approach for anonymous user management
 * Tree-shakable exports for optimal bundle size
 */

export interface AnonymousUserInfo {
  id: string;
  created_at: string;
  device_info: {
    type: 'mobile' | 'tablet' | 'desktop';
    screen_resolution: string;
    user_agent: string;
    browser_info: string;
  };
}

// Constants
const STORAGE_KEY = 'scan_jone_anonymous_user';
const ID_PREFIX = 'anon';

/**
 * Enhanced device information gathering
 */
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop' as const,
      screen_resolution: '',
      user_agent: '',
      browser_info: ''
    };
  }

  const width = window.innerWidth;
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  if (width < 640) type = 'mobile';
  else if (width < 1024) type = 'tablet';

  return {
    type,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    user_agent: navigator.userAgent,
    browser_info: getBrowserInfo()
  };
};

/**
 * Get browser information for analytics
 */
const getBrowserInfo = (): string => {
  if (typeof window === 'undefined') return '';

  const info = {
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  };

  return JSON.stringify(info);
};

/**
 * Create new anonymous user with device fingerprinting
 */
const createNewAnonymousUser = (): AnonymousUserInfo => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const id = `${ID_PREFIX}_${timestamp}_${random}`;

  return {
    id,
    created_at: new Date().toISOString(),
    device_info: getDeviceInfo()
  };
};

/**
 * Validate anonymous user data structure
 */
const validateAnonymousUser = (user: any): user is AnonymousUserInfo => {
  return (
    user &&
    typeof user.id === 'string' &&
    user.id.startsWith(ID_PREFIX) &&
    typeof user.created_at === 'string' &&
    user.device_info &&
    typeof user.device_info.type === 'string' &&
    ['mobile', 'tablet', 'desktop'].includes(user.device_info.type)
  );
};

/**
 * Store anonymous user to localStorage
 */
const storeAnonymousUser = (user: AnonymousUserInfo): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('[AnonymousUser] Failed to store user:', error);
  }
};

/**
 * Get or create anonymous user ID
 * Returns existing ID from localStorage or creates new one
 */
export const getOrCreateAnonymousUser = (): AnonymousUserInfo => {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return createNewAnonymousUser();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AnonymousUserInfo;
      // Validate stored data
      if (validateAnonymousUser(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[AnonymousUser] Failed to parse stored user:', error);
  }

  // Create new anonymous user if none exists or invalid
  const newUser = createNewAnonymousUser();
  storeAnonymousUser(newUser);
  return newUser;
};

/**
 * Get current anonymous user ID (returns null if none exists)
 */
export const getCurrentAnonymousUserId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AnonymousUserInfo;
      return validateAnonymousUser(parsed) ? parsed.id : null;
    }
  } catch (error) {
    console.warn('[AnonymousUser] Failed to get current user ID:', error);
  }

  return null;
};

/**
 * Clear anonymous user (useful for testing or reset)
 */
export const clearAnonymousUser = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[AnonymousUser] Failed to clear user:', error);
  }
};

/**
 * Check if user is returning (has existing anonymous ID)
 */
export const isReturningUser = (): boolean => {
  return getCurrentAnonymousUserId() !== null;
};

/**
 * Get user session duration (time since first visit)
 */
export const getSessionDuration = (): number => {
  const user = getOrCreateAnonymousUser();
  const createdAt = new Date(user.created_at).getTime();
  return Date.now() - createdAt;
};

/**
 * Get device information only
 */
export const getDeviceInformation = () => getDeviceInfo();

// Grouped export for convenience (optional usage)
export const anonymousUser = {
  getOrCreate: getOrCreateAnonymousUser,
  getCurrentId: getCurrentAnonymousUserId,
  clear: clearAnonymousUser,
  isReturning: isReturningUser,
  getSessionDuration,
  getDeviceInfo: getDeviceInformation
} as const;