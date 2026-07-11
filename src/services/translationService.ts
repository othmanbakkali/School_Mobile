import { ref, computed } from 'vue';
import { fr } from '../locales/fr';
import { ar } from '../locales/ar';

// Retrieve saved language preference or default to French
const currentLocale = ref<string>(localStorage.getItem('preferred_language') || 'fr');

// In-memory translation cache to avoid redundant API calls
const translationCache = new Map<string, string>();

/**
 * HTML entity decoder helper
 */
function decodeHtmlEntities(str: string): string {
  if (typeof document === 'undefined') return str;
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

export function useI18n() {
  /**
   * Translate static UI strings
   */
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let obj: any = currentLocale.value === 'ar' ? ar : fr;
    
    for (const k of keys) {
      if (obj && obj[k] !== undefined) {
        obj = obj[k];
      } else {
        // Fallback to French if key not found in Arabic
        let fallbackObj: any = fr;
        for (const fk of keys) {
          if (fallbackObj && fallbackObj[fk] !== undefined) {
            fallbackObj = fallbackObj[fk];
          } else {
            return key; // return the path as fallback
          }
        }
        obj = fallbackObj;
        break;
      }
    }

    let result = typeof obj === 'string' ? obj : key;

    // Replace parameters if provided, e.g. {name}
    if (params && typeof result === 'string') {
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
      });
    }

    return result;
  };

  /**
   * Change locale, save in localStorage, and trigger direction (RTL/LTR)
   */
  const setLocale = (locale: 'fr' | 'ar') => {
    currentLocale.value = locale;
    localStorage.setItem('preferred_language', locale);
    
    // Apply layout direction and document class
    if (typeof document !== 'undefined') {
      if (locale === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.classList.add('rtl-layout');
        document.documentElement.classList.remove('ltr-layout');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.classList.add('ltr-layout');
        document.documentElement.classList.remove('rtl-layout');
      }
    }
  };

  /**
   * Initialize layout direction on startup
   */
  const initLocale = () => {
    setLocale(currentLocale.value as 'fr' | 'ar');
  };

  const isRTL = computed(() => currentLocale.value === 'ar');

  return {
    t,
    setLocale,
    initLocale,
    locale: currentLocale,
    isRTL
  };
}

/**
 * Instant translation of dynamic content using MyMemory API
 */
export async function translateText(text: string, targetLang: 'fr' | 'ar'): Promise<string> {
  const cleanText = text?.trim();
  if (!cleanText) return '';

  const sourceLang = targetLang === 'ar' ? 'fr' : 'ar';
  const cacheKey = `${sourceLang}|${targetLang}:${cleanText}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Call MyMemory translation API (free, public)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to translate content');
    
    const data = await response.json();
    if (data && data.responseData && data.responseData.translatedText) {
      const translated = decodeHtmlEntities(data.responseData.translatedText);
      translationCache.set(cacheKey, translated);
      return translated;
    }
    throw new Error('Invalid response from translation API');
  } catch (error) {
    console.error('Error during dynamic translation:', error);
    throw error;
  }
}
