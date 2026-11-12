// T074: Internationalization (i18n) utility module
// Provides helper functions for Chrome i18n API

// Translation cache for custom language override
let translationCache = null;
let currentLocale = null;

/**
 * Load translations from a specific locale
 * @param {string} locale - Locale code (e.g., 'en', 'zh_CN', 'zh_TW')
 * @returns {Promise<Object>} Translation messages object
 */
async function loadTranslations(locale) {
  try {
    const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);
    const messages = await response.json();
    return messages;
  } catch (error) {
    console.warn(`Failed to load translations for locale: ${locale}`, error);
    return null;
  }
}

/**
 * Initialize i18n. This build only ships Simplified Chinese, so the locale is
 * fixed; the parameter is kept for call-site compatibility.
 * @param {string} [_preferredLocale] - Ignored, kept for backwards compatibility.
 */
export async function initializeLanguage(_preferredLocale = null) {
  const locale = 'zh_CN';

  translationCache = await loadTranslations(locale);
  currentLocale = locale;
}

/**
 * Get browser's locale in our supported format.
 * Only Simplified Chinese is supported in this build.
 * @returns {string} Locale code
 */
function getBrowserLocale() {
  return 'zh_CN';
}

/**
 * Get translated message with substitutions support
 * @param {string} key - Message key from messages.json
 * @param {string|string[]} substitutions - Optional substitution values
 * @returns {string} Translated message
 */
export function t(key, substitutions = null) {
  // If we have custom translations loaded, use them
  if (translationCache && translationCache[key]) {
    let message = translationCache[key].message || '';

    // Handle substitutions
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, index) => {
        const placeholder = `$${index + 1}`;
        message = message.replace(new RegExp(`\\$${index + 1}`, 'g'), sub);
        // Also try $PLACEHOLDER$ format
        if (translationCache[key].placeholders) {
          Object.entries(translationCache[key].placeholders).forEach(([name, config]) => {
            if (config.content === placeholder) {
              message = message.replace(new RegExp(`\\$${name.toUpperCase()}\\$`, 'g'), sub);
            }
          });
        }
      });
    }

    return message;
  }

  // Fallback to Chrome's native i18n
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      return chrome.i18n.getMessage(key, substitutions) || key;
    }
  } catch (error) {
    // chrome.i18n not available
  }
  return key;
}

/**
 * Translate all elements with data-i18n attribute
 * @param {HTMLElement} root - Root element to search (default: document)
 */
export function translatePage(root = document) {
  // Translate elements with data-i18n attribute for text content
  root.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = t(key);
    }
  });

  // Translate elements with data-i18n-html attribute for HTML content
  root.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    if (key) {
      element.innerHTML = t(key);
    }
  });

  // Translate placeholders
  root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key) {
      element.placeholder = t(key);
    }
  });

  // Translate titles/tooltips
  root.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (key) {
      element.title = t(key);
    }
  });

  // Translate aria-labels
  root.querySelectorAll('[data-i18n-aria]').forEach(element => {
    const key = element.getAttribute('data-i18n-aria');
    if (key) {
      element.setAttribute('aria-label', t(key));
    }
  });
}

/**
 * Get current UI language
 * @returns {string} Language code (e.g., 'en', 'zh_CN', 'zh_TW')
 */
export function getCurrentLanguage() {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      return chrome.i18n.getUILanguage();
    }
  } catch (error) {
    // chrome.i18n not available
  }
  return currentLocale || 'en';
}

/**
 * Locale of the loaded translations, which follows the language setting.
 * @returns {string} Locale code (e.g., 'en', 'zh_CN')
 */
export function getTranslationLocale() {
  return currentLocale || 'en';
}

/**
 * Initialize i18n for a page
 * Call this on DOMContentLoaded
 */
export function initI18n() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => translatePage());
  } else {
    translatePage();
  }
}

// Export as default for convenience
export default {
  t,
  translatePage,
  getCurrentLanguage,
  initI18n,
  initializeLanguage
};
