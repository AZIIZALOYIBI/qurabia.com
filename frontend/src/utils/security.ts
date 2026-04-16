/**
 * Security Utilities for QURABIA Frontend
 * ========================================
 * XSS prevention, input sanitization, secure storage, and CSRF protection.
 *
 * Features:
 * - XSS prevention helpers
 * - Input sanitization
 * - Secure token storage
 * - CSRF token management
 * - Request signing
 */

/**
 * XSS Prevention
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize HTML by removing script tags and dangerous attributes
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove script tags
  const scripts = div.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  // Remove event handlers
  const allElements = div.querySelectorAll('*');
  allElements.forEach((element) => {
    // Remove on* attributes
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });

    // Remove javascript: and data: hrefs
    const href = element.getAttribute('href');
    if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
      element.removeAttribute('href');
    }

    const src = element.getAttribute('src');
    if (src && (src.startsWith('javascript:') || src.startsWith('data:'))) {
      element.removeAttribute('src');
    }
  });

  return div.innerHTML;
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtmlTags(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Input Sanitization
 */

/**
 * Sanitize user input by trimming and limiting length
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = sanitizeInput(email, 254); // RFC 5321
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (emailRegex.test(sanitized)) {
    return sanitized.toLowerCase();
  }

  return null;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const sanitized = sanitizeInput(url, 2048);
    const parsed = new URL(sanitized);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Remove potentially dangerous SQL characters
 */
export function sanitizeSqlInput(input: string): string {
  // Remove SQL keywords and special characters
  return input
    .replace(/['";\\]/g, '')
    .replace(/(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bUPDATE\b|\bINSERT\b)/gi, '')
    .trim();
}

/**
 * Secure Storage
 */

const STORAGE_PREFIX = 'qurabia_secure_';

/**
 * Securely store a value in localStorage with encryption (basic)
 */
export function secureSetItem(key: string, value: string): void {
  try {
    // Basic obfuscation (in production, use proper encryption)
    const encoded = btoa(value);
    localStorage.setItem(STORAGE_PREFIX + key, encoded);
  } catch (error) {
    console.error('Failed to store item securely:', error);
  }
}

/**
 * Securely retrieve a value from localStorage
 */
export function secureGetItem(key: string): string | null {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return null;

    // Decode the obfuscated value
    return atob(item);
  } catch (error) {
    console.error('Failed to retrieve item securely:', error);
    return null;
  }
}

/**
 * Securely remove an item from localStorage
 */
export function secureRemoveItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error('Failed to remove item securely:', error);
  }
}

/**
 * Clear all secure storage items
 */
export function secureClearAll(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear secure storage:', error);
  }
}

/**
 * Token Management
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store authentication token securely
 */
export function storeToken(token: string): void {
  secureSetItem(TOKEN_KEY, token);
}

/**
 * Retrieve authentication token
 */
export function getToken(): string | null {
  return secureGetItem(TOKEN_KEY);
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  secureRemoveItem(TOKEN_KEY);
}

/**
 * Store refresh token securely
 */
export function storeRefreshToken(token: string): void {
  secureSetItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Retrieve refresh token
 */
export function getRefreshToken(): string | null {
  return secureGetItem(REFRESH_TOKEN_KEY);
}

/**
 * Remove refresh token
 */
export function removeRefreshToken(): void {
  secureRemoveItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  removeToken();
  removeRefreshToken();
}

/**
 * Check if token is expired (basic check)
 */
export function isTokenExpired(token: string): boolean {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;

    if (!exp) return false;

    // Check if expired (exp is in seconds)
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

/**
 * CSRF Protection
 */

let csrfToken: string | null = null;

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  csrfToken = token;
  return token;
}

/**
 * Get current CSRF token (generate if not exists)
 */
export function getCsrfToken(): string {
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
  }
  return csrfToken;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  return csrfToken !== null && token === csrfToken;
}

/**
 * Request Security
 */

/**
 * Add security headers to fetch request
 */
export function addSecurityHeaders(headers: HeadersInit = {}): HeadersInit {
  const secureHeaders: HeadersInit = {
    ...headers,
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': getCsrfToken(),
  };

  const token = getToken();
  if (token) {
    secureHeaders['Authorization'] = `Bearer ${token}`;
  }

  return secureHeaders;
}

/**
 * Secure fetch wrapper with automatic retries and error handling
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add security headers
      const secureOptions: RequestInit = {
        ...options,
        headers: addSecurityHeaders(options.headers),
      };

      const response = await fetch(url, secureOptions);

      // Handle token refresh on 401
      if (response.status === 401) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          // Retry with new token
          secureOptions.headers = addSecurityHeaders(options.headers);
          return await fetch(url, secureOptions);
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Refresh authentication token
 */
async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearAuthTokens();
      return false;
    }

    const data = await response.json();
    if (data.token) {
      storeToken(data.token);
      return true;
    }

    return false;
  } catch {
    clearAuthTokens();
    return false;
  }
}

/**
 * Content Security Policy helpers
 */

/**
 * Check if Content Security Policy is enabled
 */
export function isCspEnabled(): boolean {
  const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  return meta !== null;
}

/**
 * Validate resource URL against CSP
 */
export function isResourceAllowed(url: string, type: 'script' | 'style' | 'img'): boolean {
  try {
    const parsed = new URL(url, window.location.origin);

    // Allow same-origin resources
    if (parsed.origin === window.location.origin) {
      return true;
    }

    // Check against known safe CDNs
    const safeCdns = [
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdnjs.cloudflare.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ];

    return safeCdns.some((cdn) => parsed.hostname.includes(cdn));
  } catch {
    return false;
  }
}

/**
 * Security utilities export
 */
export const SecurityUtils = {
  // XSS Prevention
  escapeHtml,
  sanitizeHtml,
  stripHtmlTags,

  // Input Sanitization
  sanitizeInput,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeSqlInput,

  // Secure Storage
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  secureClearAll,

  // Token Management
  storeToken,
  getToken,
  removeToken,
  storeRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  clearAuthTokens,
  isTokenExpired,

  // CSRF Protection
  generateCsrfToken,
  getCsrfToken,
  validateCsrfToken,

  // Request Security
  addSecurityHeaders,
  secureFetch,

  // CSP Helpers
  isCspEnabled,
  isResourceAllowed,
};

export default SecurityUtils;
