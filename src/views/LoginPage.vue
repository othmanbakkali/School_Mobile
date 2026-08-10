
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-page">
      <div class="background-blobs">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>

      <div class="login-wrapper fade-in">
        <div class="header-section">
          <div class="logo-box glass-effect">
            <ion-icon :icon="schoolOutline"></ion-icon>
          </div>
          <h1>Scolarité<span class="dot">.</span></h1>
          <p>Espace Parents Odoo</p>
        </div>

        <div class="premium-card login-card glass-effect">
          <ion-segment v-model="loginMode" mode="md" class="role-segment">
            <ion-segment-button value="parent">
              <ion-label>Parent</ion-label>
            </ion-segment-button>
            <ion-segment-button value="admin">
              <ion-label>Administration</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="input-group">
            <div class="input-item">
              <ion-icon :icon="personOutline"></ion-icon>
              <ion-input v-model="username" :placeholder="loginMode === 'parent' ? 'Email Parent' : 'Email Administrateur'"></ion-input>
            </div>

            <div class="input-item">
              <ion-icon :icon="lockClosedOutline"></ion-icon>
              <ion-input v-model="password" type="password" :placeholder="loginMode === 'parent' ? 'Téléphone' : 'Mot de passe'"></ion-input>
            </div>
          </div>

          <ion-button expand="block" shape="round" class="login-btn primary-gradient" @click="handleLogin">
            Se Connecter
            <ion-icon slot="end" :icon="arrowForwardOutline"></ion-icon>
          </ion-button>

          <div class="helper-links">
            <a href="#">Besoin d'aide ?</a>
            <span class="bullet">•</span>
            <a href="#">Configuration</a>
          </div>
        </div>

        <div class="school-footer">
          <p>© 2026 Smart Digital School</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonContent, IonInput, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/vue';
import { schoolOutline, globeOutline, personOutline, lockClosedOutline, arrowForwardOutline, serverOutline } from 'ionicons/icons';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { loadingController, toastController } from '@ionic/vue';

const router = useRouter();
const defaultOdooUrl = import.meta.env.VITE_ODOO_URL || (
  typeof window !== 'undefined' && window.location && window.location.protocol === 'https:'
    ? window.location.origin
    : 'http://198.199.75.86:8069'
);
const url = ref(defaultOdooUrl);
const db = ref(import.meta.env.VITE_ODOO_DB || 'school');
const username = ref('');
const password = ref('');
const loginMode = ref('parent');

const handleLogin = async () => {
  const loading = await loadingController.create({
    message: 'Connexion en cours...',
  });
  await loading.present();

  try {
    if (loginMode.value === 'admin') {
      await odoo.adminLogin(url.value, db.value, username.value, password.value);
      router.push('/admin/inbox');
    } else {
      await odoo.login(url.value, db.value, username.value, password.value);
      router.push('/selection');
    }
  } catch (error: any) {
    const toast = await toastController.create({
      message: 'Erreur: ' + error.message,
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    loading.dismiss();
  }
};
</script>

<style scoped>
.login-page {
  --background: #f8fafc;
  display: flex;
  overflow: hidden;
}

.background-blobs {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
  filter: blur(80px);
  opacity: 0.5;
}

.blob {
  position: absolute;
  border-radius: 50%;
}

.blob-1 {
  width: 300px;
  height: 300px;
  background: #6366f1;
  top: -50px;
  right: -50px;
}

.blob-2 {
  width: 250px;
  height: 250px;
  background: #8b5cf6;
  bottom: -50px;
  left: -50px;
}

.login-wrapper {
  padding: 40px 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-box {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 2.8rem;
  color: #6366f1;
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3);
}

.header-section h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  color: #1e293b;
  letter-spacing: -1px;
}

.header-section h1 .dot {
  color: #6366f1;
}

.header-section p {
  color: #94a3b8;
  margin: 8px 0 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 30px 20px !important;
}

.role-segment {
  margin-bottom: 25px;
  background: var(--ion-color-step-50, #f8fafc);
  padding: 4px;
  border-radius: 12px;
}

.role-segment ion-segment-button {
  --color: #64748b;
  --color-checked: #1e293b;
  --indicator-color: white;
  --background-checked: white;
  min-height: 40px;
  border-radius: 10px;
  font-weight: 700;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.input-item {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 16px;
  padding: 5px 15px;
  gap: 12px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.input-item:focus-within {
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-item ion-icon {
  font-size: 1.2rem;
  color: #94a3b8;
}

.input-item ion-input {
  --padding-start: 0;
  font-weight: 500;
  font-size: 1rem;
  color: #1e293b;
}

.login-btn {
  height: 56px;
  margin: 0;
  font-weight: 700;
  font-size: 1.1rem;
  --box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
}

.primary-gradient {
  --background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.helper-links {
  text-align: center;
  margin-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.helper-links a {
  color: #64748b;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.bullet {
  color: #e2e8f0;
}

.school-footer {
  margin-top: 50px;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
