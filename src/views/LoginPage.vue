
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
            <img :src="'/api/school/company-logo'" class="company-logo-img" alt="Logo Société" @error="logoError = true" v-if="!logoError" />
            <ion-icon :icon="schoolOutline" v-else></ion-icon>
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

          <div v-if="loginMode === 'parent'" class="auth-hint-banner">
            <ion-icon :icon="informationCircleOutline"></ion-icon>
            <span>Login : <strong>N° Téléphone</strong> • Mot de passe : <strong>20262027</strong></span>
          </div>

          <div class="input-group">
            <div class="input-item">
              <ion-icon :icon="loginMode === 'parent' ? callOutline : personOutline"></ion-icon>
              <ion-input 
                v-model="username" 
                :type="loginMode === 'parent' ? 'tel' : 'text'"
                :placeholder="loginMode === 'parent' ? 'N° Téléphone Parent (ex: 06...)' : 'Email Administrateur'"
              ></ion-input>
            </div>

            <div class="input-item">
              <ion-icon :icon="lockClosedOutline"></ion-icon>
              <ion-input 
                v-model="password" 
                type="password" 
                :placeholder="loginMode === 'parent' ? 'Mot de passe (20262027)' : 'Mot de passe'"
              ></ion-input>
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
          <p>© 2026 Smart Digital School by <a href="https://www.sdbo.ma" target="_blank" rel="noopener" class="sdbo-link">www.sdbo.ma</a></p>
        </div>
      </div>

      <!-- Modal de Première Connexion : Changement Obligatoire du Mot de Passe -->
      <ion-modal v-if="showFirstLoginModal" :is-open="showFirstLoginModal" :backdrop-dismiss="false" class="first-login-modal">
        <div class="first-login-modal-wrapper">
          <div class="modal-card glass-modal">
            <div class="shield-badge">
              <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            </div>

            <h2 class="modal-title">Première Connexion</h2>
            <p class="modal-intro">
              Bienvenue <strong v-if="pendingParentName">{{ pendingParentName }}</strong> ! 
              Pour garantir la sécurité et la confidentialité du dossier scolaire de vos enfants, veuillez définir un <strong>nouveau mot de passe personnel</strong> pour remplacer le mot de passe initial.
            </p>

            <div class="initial-pass-info">
              <ion-icon :icon="keyOutline"></ion-icon>
              <span>Mot de passe provisoire (<strong>20262027</strong>) validé.</span>
            </div>

            <div class="modal-inputs">
              <!-- Nouveau Mot de passe -->
              <div class="modal-input-field">
                <label>Nouveau mot de passe personnel</label>
                <div class="field-box">
                  <ion-icon :icon="lockClosedOutline" class="field-icon"></ion-icon>
                  <ion-input 
                    v-model="newPassword" 
                    :type="showNewPass ? 'text' : 'password'"
                    placeholder="Au moins 6 caractères"
                  ></ion-input>
                  <button type="button" class="eye-toggle-btn" @click="showNewPass = !showNewPass">
                    <ion-icon :icon="showNewPass ? eyeOffOutline : eyeOutline"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Confirmation Mot de passe -->
              <div class="modal-input-field">
                <label>Confirmer le nouveau mot de passe</label>
                <div class="field-box">
                  <ion-icon :icon="checkmarkDoneOutline" class="field-icon"></ion-icon>
                  <ion-input 
                    v-model="confirmPassword" 
                    :type="showConfirmPass ? 'text' : 'password'"
                    placeholder="Retapez votre mot de passe"
                  ></ion-input>
                  <button type="button" class="eye-toggle-btn" @click="showConfirmPass = !showConfirmPass">
                    <ion-icon :icon="showConfirmPass ? eyeOffOutline : eyeOutline"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Règles de sécurité interactives -->
              <div class="security-rules">
                <div class="rule-line" :class="{ 'rule-valid': isLengthValid }">
                  <ion-icon :icon="isLengthValid ? checkmarkCircle : ellipseOutline"></ion-icon>
                  <span>Au moins 6 caractères</span>
                </div>
                <div class="rule-line" :class="{ 'rule-valid': isDifferentFromDefault }">
                  <ion-icon :icon="isDifferentFromDefault ? checkmarkCircle : ellipseOutline"></ion-icon>
                  <span>Différent du mot de passe initial (20262027)</span>
                </div>
                <div class="rule-line" :class="{ 'rule-valid': isMatchingValid }">
                  <ion-icon :icon="isMatchingValid ? checkmarkCircle : ellipseOutline"></ion-icon>
                  <span>Les deux mots de passe sont identiques</span>
                </div>
              </div>

              <div v-if="newPassError" class="modal-alert-error">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
                <span>{{ newPassError }}</span>
              </div>

              <ion-button 
                expand="block" 
                shape="round" 
                class="save-first-pass-btn primary-gradient"
                :disabled="!canSubmitPass || isSubmittingPass"
                @click="submitFirstLoginPassword"
              >
                <ion-spinner name="crescent" color="light" v-if="isSubmittingPass"></ion-spinner>
                <span v-else>Valider et Accéder à mon Espace</span>
                <ion-icon slot="end" :icon="arrowForwardOutline" v-if="!isSubmittingPass"></ion-icon>
              </ion-button>

              <ion-button 
                fill="clear" 
                color="medium" 
                size="small" 
                class="cancel-btn"
                @click="cancelFirstLogin"
              >
                Annuler / Déconnexion
              </ion-button>
            </div>
          </div>
        </div>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonContent, IonInput, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonModal, IonSpinner
} from '@ionic/vue';
import { 
  schoolOutline, globeOutline, personOutline, lockClosedOutline, 
  arrowForwardOutline, serverOutline, callOutline, informationCircleOutline,
  shieldCheckmarkOutline, keyOutline, checkmarkDoneOutline, eyeOutline, 
  eyeOffOutline, checkmarkCircle, ellipseOutline, alertCircleOutline 
} from 'ionicons/icons';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { loadingController, toastController } from '@ionic/vue';

const router = useRouter();
const defaultOdooUrl = import.meta.env.VITE_ODOO_URL || (
  typeof window !== 'undefined' && window.location && window.location.protocol === 'https:'
    ? window.location.origin
    : 'https://adminschool.alibdaealamia.ma'
);
const url = ref(defaultOdooUrl);
const db = ref(import.meta.env.VITE_ODOO_DB || 'alibdaealamia');
const username = ref('');
const password = ref('');
const loginMode = ref('parent');
const logoError = ref(false);

// Modal Première Connexion
const showFirstLoginModal = ref(false);
const pendingParentId = ref<number | string>('');
const pendingParentName = ref('');
const pendingCurrentPassword = ref('');
const pendingEmail = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showNewPass = ref(false);
const showConfirmPass = ref(false);
const newPassError = ref('');
const isSubmittingPass = ref(false);

// Validation rules
const isLengthValid = computed(() => newPassword.value.trim().length >= 6);
const isDifferentFromDefault = computed(() => {
  const p = newPassword.value.trim();
  return p.length > 0 && p !== '20262027' && p !== '2026-2027';
});
const isMatchingValid = computed(() => {
  const p1 = newPassword.value.trim();
  const p2 = confirmPassword.value.trim();
  return p1.length > 0 && p1 === p2;
});
const canSubmitPass = computed(() => isLengthValid.value && isDifferentFromDefault.value && isMatchingValid.value);

const handleLogin = async () => {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const loading = await loadingController.create({
    message: 'Connexion en cours...',
  });
  await loading.present();

  try {
    if (loginMode.value === 'admin') {
      await odoo.adminLogin(url.value, db.value, username.value, password.value);
      const pending = localStorage.getItem('redirect_after_login');
      if (pending && (pending.startsWith('/admin') || pending.startsWith('/chat'))) {
        localStorage.removeItem('redirect_after_login');
        router.push(pending);
      } else {
        router.push('/admin/inbox');
      }
    } else {
      const loginRes = await odoo.login(url.value, db.value, username.value, password.value);
      
      // Si c'est la première connexion : obligation de changer le mot de passe
      if (loginRes && loginRes.must_change_password) {
        pendingParentId.value = loginRes.uid;
        pendingParentName.value = loginRes.name || '';
        pendingEmail.value = loginRes.email || '';
        pendingCurrentPassword.value = password.value;
        newPassword.value = '';
        confirmPassword.value = '';
        newPassError.value = '';
        showFirstLoginModal.value = true;
      } else {
        router.push('/selection');
      }
    }
  } catch (error: any) {
    const toast = await toastController.create({
      message: 'Erreur: ' + error.message,
      duration: 3500,
      color: 'danger',
    });
    await toast.present();
  } finally {
    loading.dismiss();
  }
};

const submitFirstLoginPassword = async () => {
  if (!isLengthValid.value) {
    newPassError.value = "Le mot de passe doit comporter au moins 6 caractères.";
    return;
  }
  if (!isDifferentFromDefault.value) {
    newPassError.value = "Le nouveau mot de passe ne peut pas être le mot de passe initial (20262027).";
    return;
  }
  if (!isMatchingValid.value) {
    newPassError.value = "Les deux mots de passe ne correspondent pas.";
    return;
  }

  isSubmittingPass.value = true;
  newPassError.value = '';

  try {
    await odoo.changePassword(
      pendingParentId.value,
      pendingCurrentPassword.value,
      newPassword.value.trim(),
      {
        url: url.value,
        db: db.value,
        user: username.value,
        email: pendingEmail.value,
        name: pendingParentName.value
      }
    );

    const toast = await toastController.create({
      message: 'Votre mot de passe personnel a été enregistré avec succès !',
      duration: 3500,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    showFirstLoginModal.value = false;
    router.push('/selection');
  } catch (err: any) {
    newPassError.value = err.message || "Erreur lors du changement de mot de passe.";
  } finally {
    isSubmittingPass.value = false;
  }
};

const cancelFirstLogin = () => {
  showFirstLoginModal.value = false;
  password.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  odoo.logout();
};
</script>

<style scoped>
.login-page {
  --background: #f8fafc;
}

.background-blobs {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
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
  position: relative;
  z-index: 10;
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
  overflow: hidden;
}

.company-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
  padding: 6px;
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

.auth-hint-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #4338ca;
  margin-bottom: 20px;
  line-height: 1.4;
}

.auth-hint-banner ion-icon {
  font-size: 1.25rem;
  color: #6366f1;
  flex-shrink: 0;
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
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}

.school-footer p {
  margin: 3px 0;
}

.sdbo-link {
  color: #6366f1;
  font-weight: 700;
  text-decoration: underline;
}

.sub-footer {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Modal Première Connexion */
.first-login-modal {
  --background: rgba(15, 23, 42, 0.7);
  --backdrop-opacity: 0.7;
}

.first-login-modal-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 16px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 28px;
  padding: 28px 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  animation: modalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes modalScaleUp {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.shield-badge {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 850;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.modal-intro {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 18px 0;
}

.modal-intro strong {
  color: #1e293b;
}

.initial-pass-info {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.82rem;
  color: #065f46;
  margin-bottom: 20px;
  text-align: left;
}

.initial-pass-info ion-icon {
  font-size: 1.25rem;
  color: #10b981;
  flex-shrink: 0;
}

.modal-inputs {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
}

.modal-input-field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 750;
  color: #334155;
  margin-bottom: 6px;
}

.field-box {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 2px 12px;
  transition: all 0.2s ease;
}

.field-box:focus-within {
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.field-icon {
  font-size: 1.15rem;
  color: #94a3b8;
  margin-right: 8px;
  flex-shrink: 0;
}

.field-box ion-input {
  --padding-start: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.eye-toggle-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.eye-toggle-btn:hover {
  color: #4f46e5;
}

.security-rules {
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px dashed #cbd5e1;
}

.rule-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 600;
  transition: color 0.2s ease;
}

.rule-line ion-icon {
  font-size: 0.95rem;
  color: #cbd5e1;
  transition: all 0.2s ease;
}

.rule-line.rule-valid {
  color: #059669;
}

.rule-line.rule-valid ion-icon {
  color: #10b981;
}

.modal-alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  padding: 8px 12px;
  color: #b91c1c;
  font-size: 0.8rem;
  font-weight: 650;
}

.modal-alert-error ion-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.save-first-pass-btn {
  height: 52px;
  font-weight: 800;
  font-size: 0.98rem;
  margin-top: 8px;
  --box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
}

.cancel-btn {
  font-size: 0.82rem;
  font-weight: 600;
  --color: #64748b;
  margin-top: 2px;
}
</style>
