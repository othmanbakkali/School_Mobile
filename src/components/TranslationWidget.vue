<template>
  <div class="translation-widget-container">
    <!-- Un-translated state button -->
    <div v-if="!isTranslated && !loading" class="translate-action" @click.stop="handleTranslate">
      <ion-icon :icon="globeOutline" class="translate-icon"></ion-icon>
      <span class="translate-btn-text">{{ isArabicTarget ? 'Traduire en Arabe' : 'ترجمة للعربية / الفرنسية' }}</span>
      <span class="premium-badge-ai">IA</span>
    </div>

    <!-- Loading spinner state -->
    <div v-else-if="loading" class="translate-loading">
      <ion-spinner name="dots" color="primary" class="loading-spinner"></ion-spinner>
      <span class="loading-text">{{ isArabicTarget ? 'Traduction en cours...' : 'جاري الترجمة...' }}</span>
    </div>

    <!-- Translated text content layout -->
    <div v-else-if="isTranslated" class="translated-wrapper fade-in">
      <div class="translated-header">
        <div class="header-left">
          <span class="stars-icon">✨</span>
          <span class="translated-badge-title">{{ locale === 'ar' ? 'ترجمة فورية' : 'Traduction instantanée' }}</span>
        </div>
        <div class="header-right" @click.stop="handleReset">
          <span class="btn-reset-text">{{ locale === 'ar' ? 'عرض الأصلي' : 'Voir l\'original' }}</span>
          <ion-icon :icon="arrowUndoOutline" class="reset-icon"></ion-icon>
        </div>
      </div>
      <div class="translated-content" :dir="isArabicTarget ? 'rtl' : 'ltr'">
        {{ translatedText }}
      </div>
    </div>

    <!-- Error fallback state -->
    <div v-if="error" class="translate-error">
      <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
      <span>{{ locale === 'ar' ? 'فشلت الترجمة. حاول مجدداً.' : 'Échec de la traduction. Réessayez.' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonIcon, IonSpinner } from '@ionic/vue';
import { globeOutline, arrowUndoOutline, alertCircleOutline } from 'ionicons/icons';
import { translateText, useI18n } from '@/services/translationService';

const props = defineProps<{
  text: string;
}>();

const { locale } = useI18n();
const loading = ref(false);
const isTranslated = ref(false);
const translatedText = ref('');
const error = ref(false);

const isArabicTarget = computed(() => {
  // If the text is translated while in Arabic locale, translate to Arabic
  return locale.value === 'ar';
});

const handleTranslate = async () => {
  if (!props.text) return;
  loading.value = true;
  error.value = false;
  try {
    const targetLang = locale.value === 'ar' ? 'ar' : 'fr';
    const translated = await translateText(props.text, targetLang);
    translatedText.value = translated;
    isTranslated.value = true;
  } catch (err) {
    error.value = true;
    console.error('Dynamic translation failed:', err);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  isTranslated.value = false;
  translatedText.value = '';
  error.value = false;
};
</script>

<style scoped>
.translation-widget-container {
  margin-top: 8px;
  width: 100%;
}

/* Button style */
.translate-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(92, 45, 84, 0.06);
  border: 1px solid rgba(92, 45, 84, 0.15);
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.translate-action:active {
  background: rgba(92, 45, 84, 0.15);
  transform: scale(0.96);
}

.translate-icon {
  font-size: 0.95rem;
  color: #5c2d54;
}

.translate-btn-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #5c2d54;
  letter-spacing: 0.2px;
}

.premium-badge-ai {
  font-size: 0.6rem;
  font-weight: 900;
  color: #ffffff;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 2px;
  text-transform: uppercase;
}

/* Loading style */
.translate-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.loading-spinner {
  --color: #5c2d54;
}

.loading-text {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Translated Content Style (Premium Glassmorphism) */
.translated-wrapper {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(92, 45, 84, 0.15);
  border-radius: 14px;
  padding: 10px 14px;
  margin-top: 6px;
  box-shadow: 0 4px 12px rgba(92, 45, 84, 0.05);
}

.translated-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(92, 45, 84, 0.15);
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stars-icon {
  font-size: 0.8rem;
}

.translated-badge-title {
  font-size: 0.7rem;
  font-weight: 800;
  color: #5c2d54;
  text-transform: uppercase;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.header-right:active {
  opacity: 1;
}

.btn-reset-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.reset-icon {
  font-size: 0.85rem;
  color: #64748b;
}

.translated-content {
  font-size: 0.85rem;
  line-height: 1.45;
  color: #1e293b;
  font-weight: 500;
}

/* Error style */
.translate-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 4px;
}

.error-icon {
  font-size: 0.9rem;
}

/* Micro-animations */
.fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
