<template>
  <div v-if="needRefresh || hasServerUpdate" class="update-banner">
    <div class="update-card">
      <div class="update-header">
        <div class="icon-pulse-container">
          <span class="update-emoji">🚀</span>
        </div>
        <div class="update-texts">
          <h4 class="update-title">Nouvelle mise à jour disponible</h4>
          <p class="update-desc">
            Une nouvelle version de l'application est prête avec des améliorations et corrections.
          </p>
        </div>
      </div>
      <div class="update-actions">
        <button class="btn-later" @click="dismiss">Plus tard</button>
        <button class="btn-update" :disabled="isUpdating" @click="handleUpdate">
          <span v-if="!isUpdating">Mettre à jour</span>
          <span v-else>Installation...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { apiRequest } from '@/services/api';

const isUpdating = ref(false);
const hasServerUpdate = ref(false);
const dismissedForSession = ref(false);

// Service Worker Registration with virtual:pwa-register/vue
const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    console.log('[PWA SW] Service Worker enregistré avec succès:', swUrl);
    if (registration) {
      // 1. Vérifier les mises à jour toutes les 10 minutes
      const interval = setInterval(() => {
        console.log('[PWA SW] Vérification périodique des mises à jour...');
        registration.update();
      }, 10 * 60 * 1000);

      // 2. Vérifier les mises à jour dès que l'application redevient visible (déverrouillage ou retour au premier plan)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('[PWA SW] App au premier plan, vérification de mise à jour...');
          registration.update();
          checkServerVersion();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      onUnmounted(() => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      });
    }
  },
  onNeedRefresh() {
    console.log('[PWA SW] Nouvelle version prête dans le cache ! Déclenchement de la notification.');
  },
  onOfflineReady() {
    console.log('[PWA SW] Application prête pour une utilisation hors ligne.');
  }
});

// Vérification de version complémentaire via l'API serveur
const checkServerVersion = async () => {
  try {
    const res = await apiRequest('/api/version');
    if (res && res.version) {
      const currentStored = localStorage.getItem('app_current_version');
      if (!currentStored) {
        localStorage.setItem('app_current_version', res.version);
      } else if (currentStored !== res.version && !dismissedForSession.value) {
        console.log('[App Version] Nouvelle version détectée côté serveur:', res.version, 'Actuelle:', currentStored);
        hasServerUpdate.value = true;
      }
    }
  } catch (e) {
    // Silently ignore if offline
  }
};

const handleUpdate = async () => {
  isUpdating.value = true;
  try {
    // Si une nouvelle version de Service Worker est disponible
    if (needRefresh.value) {
      await updateServiceWorker(true);
    } else {
      // Recharger et purger le cache applicatif
      const res = await apiRequest('/api/version').catch(() => null);
      if (res && res.version) {
        localStorage.setItem('app_current_version', res.version);
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      window.location.reload();
    }
  } catch (e) {
    console.error('Erreur lors de la mise à jour:', e);
    window.location.reload();
  }
};

const dismiss = () => {
  needRefresh.value = false;
  hasServerUpdate.value = false;
  dismissedForSession.value = true;
};

onMounted(() => {
  checkServerVersion();
});
</script>

<style scoped>
.update-banner {
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 10000;
  display: flex;
  justify-content: center;
  animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.update-card {
  max-width: 440px;
  width: 100%;
  background: linear-gradient(135deg, #5c2d54 0%, #3e1e38 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  padding: 16px 18px;
  color: #ffffff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.update-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.icon-pulse-container {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

.update-emoji {
  font-size: 1.5rem;
}

.update-texts {
  flex: 1;
}

.update-title {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.3px;
}

.update-desc {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
}

.update-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.btn-later {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-later:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.btn-update {
  background: #ffffff;
  color: #5c2d54;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.btn-update:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  background: #fdf2f8;
}

.btn-update:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
