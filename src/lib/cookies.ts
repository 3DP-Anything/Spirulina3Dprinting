/**
 * Cookie and local persistence management for the Spirulina 3D Printing application.
 * Manages user cookie consent, storing and restoring applied settings options.
 */

import { PrinterSettings, ModelParams } from './types';

export type CookieConsent = 'accepted' | 'rejected' | null;

export const COOKIE_CONSENT_KEY = 'spirulina_cookie_consent';
export const APPLIED_SETTINGS_KEY = 'spirulina_applied_settings';
export const APPLIED_PARAMS_KEY = 'spirulina_applied_params';

/**
 * Reads a cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Sets a persistent cookie with a max-age in days
 */
export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Deletes a cookie by name
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/**
 * Returns current cookie consent status ('accepted', 'rejected', or null if never chosen)
 */
export function getCookieConsent(): CookieConsent {
  const cookieVal = getCookie(COOKIE_CONSENT_KEY);
  if (cookieVal === 'accepted' || cookieVal === 'rejected') {
    return cookieVal;
  }
  try {
    const localVal = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (localVal === 'accepted' || localVal === 'rejected') {
      return localVal;
    }
  } catch {}
  return null;
}

/**
 * Sets user cookie consent choice
 */
export function setCookieConsent(consent: 'accepted' | 'rejected'): void {
  setCookie(COOKIE_CONSENT_KEY, consent, 365);
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  } catch {}

  if (consent === 'rejected') {
    clearStoredSettings();
  }
}

/**
 * Saves applied settings to cookie storage if and only if cookies have been accepted
 */
export function saveAppliedSettings(settings: PrinterSettings, params?: ModelParams): void {
  if (getCookieConsent() !== 'accepted') return;

  try {
    const settingsStr = JSON.stringify(settings);
    setCookie(APPLIED_SETTINGS_KEY, settingsStr, 365);
    localStorage.setItem(APPLIED_SETTINGS_KEY, settingsStr);

    if (params) {
      const paramsStr = JSON.stringify(params);
      setCookie(APPLIED_PARAMS_KEY, paramsStr, 365);
      localStorage.setItem(APPLIED_PARAMS_KEY, paramsStr);
    }
  } catch (err) {
    console.error('Failed to save settings to cookie storage:', err);
  }
}

/**
 * Retrieves previously stored settings and model params from cookie storage
 */
export function getStoredSettings(): { settings: Partial<PrinterSettings> | null; params: Partial<ModelParams> | null } | null {
  if (getCookieConsent() !== 'accepted') return null;

  try {
    const rawSettings = getCookie(APPLIED_SETTINGS_KEY) || (typeof localStorage !== 'undefined' ? localStorage.getItem(APPLIED_SETTINGS_KEY) : null);
    const rawParams = getCookie(APPLIED_PARAMS_KEY) || (typeof localStorage !== 'undefined' ? localStorage.getItem(APPLIED_PARAMS_KEY) : null);

    return {
      settings: rawSettings ? JSON.parse(rawSettings) : null,
      params: rawParams ? JSON.parse(rawParams) : null,
    };
  } catch (err) {
    console.error('Failed to parse stored settings from cookie storage:', err);
    return null;
  }
}

/**
 * Clears stored settings and parameters from cookies and local storage
 */
export function clearStoredSettings(): void {
  deleteCookie(APPLIED_SETTINGS_KEY);
  deleteCookie(APPLIED_PARAMS_KEY);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(APPLIED_SETTINGS_KEY);
      localStorage.removeItem(APPLIED_PARAMS_KEY);
    }
  } catch {}
}
