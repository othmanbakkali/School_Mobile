<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('transport.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <!-- Student Header Badge -->
      <StudentHeaderBadge />

      <div class="fade-in" v-if="loading">
        <div class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>{{ t('transport.loading') }}</p>
        </div>
      </div>

      <div class="fade-in" v-else-if="!transportData">
        <div class="empty-state-card">
          <ion-icon :icon="busOutline" class="empty-icon"></ion-icon>
          <p>{{ t('transport.notRegistered') }}</p>
        </div>
      </div>

      <div class="fade-in" v-else>
        <!-- Page Hero -->
        <div class="page-hero">
          <div class="hero-icon">🚌</div>
          <h1>{{ transportData.name || 'Ligne Scolaire' }}</h1>
          <p>{{ t('transport.subtitle') }}</p>
        </div>

        <!-- ========================================== -->
        <!-- LIVE TRIP STATUS CARD (EN DIRECT)          -->
        <!-- ========================================== -->
        <div class="section-label">{{ t('transport.trackingSection') }}</div>
        
        <div class="premium-card live-status-card ion-padding" :class="liveTripStatus.cardClass">
          <div class="status-top-bar">
            <div class="live-pulse-badge" :class="liveTripStatus.badgeClass">
              <span class="live-dot" v-if="liveTripStatus.isLive"></span>
              <span class="badge-text">{{ liveTripStatus.badgeText }}</span>
            </div>
            <div class="current-time-pill">
              <span class="clock-icon">🕒</span>
              <span class="time-str">{{ formattedCurrentTime }}</span>
            </div>
          </div>

          <div class="status-main-info">
            <h2 class="status-title">{{ liveTripStatus.title }}</h2>
            <p class="status-desc">{{ liveTripStatus.desc }}</p>
          </div>

          <!-- Dynamic Timeline based on Morning / Evening / Weekend -->
          <div class="timeline-container" v-if="liveTripStatus.showTimeline">
            <!-- Morning Timeline -->
            <template v-if="liveTripStatus.isMorning">
              <div class="timeline-step" :class="{ 'done': liveTripStatus.step >= 1 }">
                <div class="step-marker">{{ liveTripStatus.step >= 1 ? '✓' : '1' }}</div>
                <div class="step-content">
                  <h4>07:00 • Départ du dépôt</h4>
                  <p>Bus inspecté et en route</p>
                </div>
              </div>
              
              <div class="timeline-step" :class="{ 'done': liveTripStatus.step > 2, 'active': liveTripStatus.step === 2, 'pending': liveTripStatus.step < 2 }">
                <div class="step-marker" :class="{ 'pulse': liveTripStatus.step === 2 }">
                  {{ liveTripStatus.step > 2 ? '✓' : '🚌' }}
                </div>
                <div class="step-content">
                  <h4>07:30 - 08:30 • Ramassage du matin</h4>
                  <p v-if="liveTripStatus.step === 2">En cours • Tournée vers l'école</p>
                  <p v-else-if="liveTripStatus.step > 2">Terminé avec succès</p>
                  <p v-else>Prévu entre 07:30 et 08:30</p>
                </div>
              </div>

              <div class="timeline-step" :class="{ 'done': liveTripStatus.step >= 3, 'pending': liveTripStatus.step < 3 }">
                <div class="step-marker">
                  {{ liveTripStatus.step >= 3 ? '✓' : '🏫' }}
                </div>
                <div class="step-content">
                  <h4>08:30 • Arrivée à l'école</h4>
                  <p v-if="liveTripStatus.step >= 3">Élèves déposés à l'école • Statut : Arrivé</p>
                  <p v-else>Arrivée prévue à 08:30</p>
                </div>
              </div>
            </template>

            <!-- Evening Timeline -->
            <template v-else>
              <div class="timeline-step" :class="{ 'done': liveTripStatus.step >= 1 }">
                <div class="step-marker">{{ liveTripStatus.step >= 1 ? '✓' : '1' }}</div>
                <div class="step-content">
                  <h4>15:45 • Mise en place à l'école</h4>
                  <p>Installation et montée des élèves</p>
                </div>
              </div>
              
              <div class="timeline-step" :class="{ 'done': liveTripStatus.step > 2, 'active': liveTripStatus.step === 2, 'pending': liveTripStatus.step < 2 }">
                <div class="step-marker" :class="{ 'pulse': liveTripStatus.step === 2 }">
                  {{ liveTripStatus.step > 2 ? '✓' : '🚌' }}
                </div>
                <div class="step-content">
                  <h4>16:00 - 17:30 • Retour du soir</h4>
                  <p v-if="liveTripStatus.step === 2">En cours • Dépose des élèves aux domiciles</p>
                  <p v-else-if="liveTripStatus.step > 2">Terminé avec succès</p>
                  <p v-else>Départ prévu à 16:00</p>
                </div>
              </div>

              <div class="timeline-step" :class="{ 'done': liveTripStatus.step >= 3, 'pending': liveTripStatus.step < 3 }">
                <div class="step-marker">
                  {{ liveTripStatus.step >= 3 ? '✓' : '🏡' }}
                </div>
                <div class="step-content">
                  <h4>17:30 • Fin de tournée / Arrivé</h4>
                  <p v-if="liveTripStatus.step >= 3">Tous les élèves sont arrivés à domicile</p>
                  <p v-else>Fin de tournée prévue à 17:30</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Weekend or Off Hours note -->
          <div class="weekend-note-box" v-else>
            <span class="note-icon">ℹ️</span>
            <p>Le service de transport fonctionne du <strong>Lundi au Vendredi</strong> de 07h30 à 08h30 (Matin) et de 16h00 à 17h30 (Après-midi).</p>
          </div>
        </div>

        <!-- Chauffeur Card -->
        <div class="section-label">{{ t('transport.driverSection') }}</div>
        <div class="premium-card driver-card ion-padding">
          <div class="driver-profile">
            <div class="driver-avatar-box">
              <div class="driver-avatar-initials">
                {{ getInitials(transportData.driver_name) }}
              </div>
              <div class="status-dot"></div>
            </div>
            <div class="driver-info">
              <h3>{{ transportData.driver_name || 'Non assigné' }}</h3>
              <p>{{ t('transport.certifiedDriver') }}</p>
              <div class="phone-row" v-if="transportData.driver_phone">
                <ion-icon :icon="callOutline"></ion-icon>
                <span>{{ transportData.driver_phone }}</span>
              </div>
            </div>
            <a :href="'tel:' + transportData.driver_phone" class="call-btn-link" v-if="transportData.driver_phone" aria-label="Appeler le chauffeur">
              <div class="call-action-btn">
                <ion-icon :icon="call"></ion-icon>
              </div>
            </a>
          </div>
        </div>

        <!-- Vehicle Details Card -->
        <div class="section-label">{{ t('transport.vehicleSection') }}</div>
        <div class="premium-card info-grid-card ion-padding">
          <div class="info-row">
            <div class="info-item">
              <ion-icon :icon="carOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span>{{ t('transport.vehicleLabel') }}</span>
                <p>{{ transportData.vehicle_info || t('transport.defaultVehicle') }}</p>
              </div>
            </div>
            <div class="vertical-divider"></div>
            <div class="info-item">
              <ion-icon :icon="timeOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span>{{ t('transport.scheduleLabel') }}</span>
                <p>{{ t('transport.morningLabel') }} <strong>07:30 - 08:30</strong></p>
                <p>{{ t('transport.eveningLabel') }} <strong>16:00 - 17:30</strong></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonMenuButton, IonIcon, IonSpinner 
} from '@ionic/vue';
import { 
  busOutline, callOutline, carOutline, timeOutline, call 
} from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();

const loading = ref(true);
const transportData = ref<any>(null);
const now = ref(new Date());

let clockTimer: any = null;

const formattedCurrentTime = computed(() => {
  return now.value.toLocaleTimeString(locale.value === 'ar' ? 'ar-MA' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

/**
 * Calcul dynamique de l'état du trajet :
 * - Lundi à Vendredi :
 *   - 07h30 - 08h30 : "Trajet en cours" (Ramassage matin)
 *   - 08h30 - 16h00 : "Arrivé à l'école" (Statut Arrivé)
 *   - 16h00 - 17h30 : "Trajet en cours" (Retour après-midi)
 *   - Après 17h30 : "Trajet terminé / Arrivé"
 *   - Avant 07h30 : "En préparation au dépôt"
 * - Samedi / Dimanche : "Service suspendu le week-end"
 */
const liveTripStatus = computed(() => {
  const current = now.value;
  const day = current.getDay(); // 0 = Dimanche, 1 = Lundi, ... 5 = Vendredi, 6 = Samedi
  const hours = current.getHours();
  const mins = current.getMinutes();
  const totalMinutes = hours * 60 + mins;

  const isWeekday = day >= 1 && day <= 5;

  if (!isWeekday) {
    return {
      isLive: false,
      showTimeline: false,
      badgeText: t('transport.suspended'),
      badgeClass: 'badge-suspended',
      cardClass: 'card-suspended',
      title: t('transport.suspended'),
      desc: t('transport.suspendedDesc'),
      isMorning: true,
      step: 0
    };
  }

  // 1. Avant 07h30 (< 450 min)
  if (totalMinutes < 450) {
    return {
      isLive: false,
      showTimeline: true,
      badgeText: t('transport.waitingMorning'),
      badgeClass: 'badge-waiting',
      cardClass: 'card-waiting',
      title: t('transport.waitingMorning'),
      desc: t('transport.waitingMorningDesc'),
      isMorning: true,
      step: 1
    };
  }

  // 2. Matin entre 07h30 et 08h30 (450 <= totalMinutes <= 510)
  if (totalMinutes >= 450 && totalMinutes <= 510) {
    return {
      isLive: true,
      showTimeline: true,
      badgeText: `🟢 ${t('transport.inProgress')}`,
      badgeClass: 'badge-in-progress',
      cardClass: 'card-in-progress',
      title: t('transport.morningInProgress'),
      desc: t('transport.morningInProgressDesc'),
      isMorning: true,
      step: 2
    };
  }

  // 3. Journée entre 08h30 et 16h00 (510 < totalMinutes < 960)
  if (totalMinutes > 510 && totalMinutes < 960) {
    return {
      isLive: false,
      showTimeline: true,
      badgeText: `🏫 ${t('transport.morningArrived')}`,
      badgeClass: 'badge-arrived',
      cardClass: 'card-arrived',
      title: t('transport.morningArrived'),
      desc: t('transport.morningArrivedDesc'),
      isMorning: true,
      step: 3
    };
  }

  // 4. Après-midi entre 16h00 et 17h30 (960 <= totalMinutes <= 1050)
  if (totalMinutes >= 960 && totalMinutes <= 1050) {
    return {
      isLive: true,
      showTimeline: true,
      badgeText: `🟢 ${t('transport.inProgress')}`,
      badgeClass: 'badge-in-progress',
      cardClass: 'card-in-progress',
      title: t('transport.eveningInProgress'),
      desc: t('transport.eveningInProgressDesc'),
      isMorning: false,
      step: 2
    };
  }

  // 5. Soir après 17h30 (> 1050 min)
  return {
    isLive: false,
    showTimeline: true,
    badgeText: `🏡 ${t('transport.eveningArrived')}`,
    badgeClass: 'badge-arrived',
    cardClass: 'card-arrived',
    title: t('transport.eveningArrived'),
    desc: t('transport.eveningArrivedDesc'),
    isMorning: false,
    step: 3
  };
});

const getInitials = (name: string) => {
  if (!name) return 'CH';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const fetchTransportInfo = async () => {
  loading.value = true;
  const studentId = odoo.selectedStudentId;
  if (!studentId) {
    loading.value = false;
    return;
  }
  try {
    const data = await apiRequest('/api/school/transport', { student_id: studentId });
    transportData.value = data;
  } catch (error) {
    console.error('Failed to fetch transport data', error);
  } finally {
    loading.value = false;
  }
};

const handleStudentChanged = () => {
  fetchTransportInfo();
};

onMounted(() => {
  fetchTransportInfo();
  window.addEventListener('student-changed', handleStudentChanged);

  // Update real-time clock every 15 seconds
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 15000);
});

onUnmounted(() => {
  window.removeEventListener('student-changed', handleStudentChanged);
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.page-hero {
  text-align: center;
  margin: 15px 0 25px 0;
  padding: 15px;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-icon {
  font-size: 3.5rem;
  margin-bottom: 8px;
  display: inline-block;
  animation: drive-horizontal 3.5s ease-in-out infinite;
}

@keyframes drive-horizontal {
  0%, 100% { transform: translateX(-6px) rotate(0deg); }
  50% { transform: translateX(6px) rotate(1deg); }
}

.page-hero h1 {
  font-size: 1.7rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.page-hero p {
  color: #64748b;
  margin: 6px 0 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #4f46e5;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 26px 4px 12px 4px;
}

.premium-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s;
  animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ==========================================
   LIVE TRIP STATUS CARD
   ========================================== */
.live-status-card {
  border-left: 5px solid #4f46e5;
  background: #ffffff;
}

.live-status-card.card-in-progress {
  border-left-color: #10b981;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
}

.live-status-card.card-arrived {
  border-left-color: #3b82f6;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.live-status-card.card-suspended {
  border-left-color: #94a3b8;
  background: #f8fafc;
}

.status-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.live-pulse-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.badge-in-progress {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: live-blink 1.2s infinite ease-in-out;
}

@keyframes live-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

.badge-arrived {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.badge-waiting {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.badge-suspended {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.current-time-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  background: rgba(0, 0, 0, 0.04);
  padding: 4px 10px;
  border-radius: 12px;
}

.status-main-info {
  margin-bottom: 20px;
}

.status-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 850;
  color: #0f172a;
}

.status-desc {
  margin: 6px 0 0 0;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.45;
  font-weight: 500;
}

.weekend-note-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f1f5f9;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.4;
}

.note-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

/* ==========================================
   DRIVER & VEHICLE CARDS
   ========================================== */
.driver-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.driver-avatar-box {
  position: relative;
  flex-shrink: 0;
}

.driver-avatar-initials {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  font-size: 1.25rem;
  border: 2px solid white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.driver-avatar-box .status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2.5px solid white;
  box-shadow: 0 0 6px #10b981;
}

.driver-info {
  flex: 1;
}

.driver-info h3 {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0f172a;
}

.driver-info p {
  margin: 3px 0 6px 0;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #4f46e5;
  font-weight: 700;
}

.phone-row ion-icon {
  font-size: 1.05rem;
}

.call-btn-link {
  text-decoration: none;
}

.call-action-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  box-shadow: 0 6px 14px rgba(21, 128, 61, 0.15);
  border: 1px solid rgba(21, 128, 61, 0.1);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s;
}

.call-action-btn:active {
  transform: scale(0.9);
  background: #dcfce7;
}

.info-row {
  display: flex;
  align-items: stretch;
}

.info-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 0;
}

.info-icon {
  font-size: 1.5rem;
  color: #4f46e5;
  background: #eef2ff;
  padding: 10px;
  border-radius: 14px;
  flex-shrink: 0;
}

.info-text span {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-text p {
  margin: 3px 0 0 0;
  font-size: 0.88rem;
  font-weight: 750;
  color: #1e293b;
  line-height: 1.4;
}

.vertical-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 0 14px;
}

/* ==========================================
   TIMELINE
   ========================================== */
.timeline-container {
  position: relative;
  padding-left: 20px;
  margin-top: 10px;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 31px;
  top: 14px;
  bottom: 14px;
  width: 3px;
  background: #e2e8f0;
}

.timeline-step {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}

.timeline-step:last-child {
  margin-bottom: 0;
}

.step-marker {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #e2e8f0;
  box-shadow: 0 0 8px rgba(0,0,0,0.03);
  z-index: 2;
  flex-shrink: 0;
}

.timeline-step.done .step-marker {
  background: #10b981;
  color: white;
  border-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
}

.timeline-step.active .step-marker {
  background: #10b981;
  border-color: #ffffff;
  font-size: 0.95rem;
  width: 32px;
  height: 32px;
  margin-left: -3px;
  box-shadow: 0 0 0 3px #10b981, 0 4px 10px rgba(16, 185, 129, 0.3);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5), 0 4px 10px rgba(16, 185, 129, 0.3);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(16, 185, 129, 0), 0 4px 10px rgba(16, 185, 129, 0.3);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 4px 10px rgba(16, 185, 129, 0.3);
  }
}

.step-content h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 750;
  color: #1e293b;
}

.step-content p {
  margin: 3px 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.timeline-step.active .step-content h4 {
  color: #059669;
}

.timeline-step.done .step-content h4 {
  color: #0f172a;
}

.empty-state-card {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
  margin-bottom: 12px;
  display: block;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #64748b;
}

/* Animations */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes floatIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
