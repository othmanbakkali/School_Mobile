<template>
  <div v-if="showInstallPrompt" class="install-banner">
    <div class="content">
      <ion-icon :icon="downloadOutline" class="icon"></ion-icon>
      <div class="text">
        <h3>Installer l'application</h3>
        <p>Accédez plus rapidement à l'école depuis votre écran d'accueil.</p>
      </div>
    </div>
    <div class="actions">
      <ion-button fill="clear" color="medium" @click="dismiss">Plus tard</ion-button>
      <ion-button fill="solid" color="primary" @click="install">Installer</ion-button>
    </div>
  </div>

  <div v-if="showIOSPrompt" class="ios-install-guide">
    <div class="guide-content">
      <div class="guide-header">
        <ion-icon :icon="shareOutline" class="icon"></ion-icon>
        <h3>Installer sur iPhone</h3>
      </div>
      <p>Appuyez sur l'icône <strong>Partager</strong> en bas du navigateur, puis sur <strong>Sur l'écran d'accueil</strong>.</p>
      <ion-button fill="clear" @click="dismissIOS">J'ai compris</ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { downloadOutline, shareOutline } from 'ionicons/icons';

const showInstallPrompt = ref(false);
const showIOSPrompt = ref(false);
let deferredPrompt: any = null;

onMounted(() => {
  // Listen for Chrome/Android install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt.value = true;
  });

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS && !isStandalone) {
    // Show iOS guide if not already installed/in standalone mode
    const hasSeenGuide = localStorage.getItem('pwa-ios-guide-seen');
    if (!hasSeenGuide) {
      showIOSPrompt.value = true;
    }
  }
});

const install = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showInstallPrompt.value = false;
  }
  deferredPrompt = null;
};

const dismiss = () => {
  showInstallPrompt.value = false;
};

const dismissIOS = () => {
  showIOSPrompt.value = false;
  localStorage.setItem('pwa-ios-guide-seen', 'true');
};
</script>

<style scoped>
.install-banner {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  z-index: 9999;
  padding: 16px;
  border: 1px solid #e2e8f0;
  animation: slideUp 0.5s ease-out;
}

.content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.icon {
  font-size: 2rem;
  color: #6366f1;
}

.text h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.text p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ios-install-guide {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
  z-index: 9999;
  text-align: center;
  animation: slideUp 0.4s ease-out;
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.guide-header .icon {
  font-size: 1.5rem;
  color: #3b82f6;
}

.guide-content h3 {
  margin: 0;
  font-weight: 700;
}

.guide-content p {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
