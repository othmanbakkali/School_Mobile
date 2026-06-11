<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Transport Scolaire</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in" v-if="loading">
        <div class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement des infos de transport...</p>
        </div>
      </div>

      <div class="fade-in" v-else-if="!transportData">
        <div class="empty-state-card">
          <ion-icon :icon="busOutline" class="empty-icon"></ion-icon>
          <p>Votre enfant n'est pas inscrit au service de transport scolaire.</p>
        </div>
      </div>

      <div class="fade-in" v-else>
        <!-- Page Hero -->
        <div class="page-hero">
          <div class="hero-icon">🚌</div>
          <h1>{{ transportData.name || 'Ligne Scolaire' }}</h1>
          <p>Suivi en temps réel de la navette scolaire</p>
        </div>

        <!-- Chauffeur Card -->
        <div class="section-label">👤 Chauffeur Assigné</div>
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
              <p>Chauffeur agréé Smart School</p>
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
        <div class="section-label">🚘 Véhicule & Horaires</div>
        <div class="premium-card info-grid-card ion-padding">
          <div class="info-row">
            <div class="info-item">
              <ion-icon :icon="carOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span>Véhicule</span>
                <p>{{ transportData.vehicle_info || 'Bus Scolaire standard' }}</p>
              </div>
            </div>
            <div class="vertical-divider"></div>
            <div class="info-item">
              <ion-icon :icon="timeOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span>Horaires</span>
                <p>Matin : {{ transportData.pickup_time || '07:30' }}</p>
                <p>Soir : {{ transportData.dropoff_time || '17:45' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tracking Timeline -->
        <div class="section-label">📍 État du trajet (Aujourd'hui)</div>
        <div class="premium-card timeline-card ion-padding">
          <div class="timeline-container">
            <div class="timeline-step done">
              <div class="step-marker">✓</div>
              <div class="step-content">
                <h4>Départ du dépôt</h4>
                <p>07:00 • Bus inspecté et prêt</p>
              </div>
            </div>
            
            <div class="timeline-step active">
              <div class="step-marker pulse">🚌</div>
              <div class="step-content">
                <h4>En route - Ramassage</h4>
                <p>En cours • Prochain arrêt : Hay Riad</p>
              </div>
            </div>

            <div class="timeline-step pending">
              <div class="step-marker">🏫</div>
              <div class="step-content">
                <h4>Arrivée École</h4>
                <p>Prévu vers 08:15</p>
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
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';

const loading = ref(true);
const transportData = ref<any>(null);

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

onMounted(() => {
  fetchTransportInfo();
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
  font-size: 1rem;
  font-weight: 500;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #5c2d54; /* Premium brand purple/eggplant */
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 30px 4px 12px 4px;
}

.premium-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  margin-bottom: 18px;
  border: 1px solid rgba(0,0,0,0.02);
  transition: transform 0.2s;
  animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.driver-card {
  animation-delay: 0.1s;
}

.info-grid-card {
  animation-delay: 0.2s;
}

.timeline-card {
  animation-delay: 0.3s;
}

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
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5c2d54 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  font-size: 1.25rem;
  border: 2px solid white;
  box-shadow: 0 6px 14px rgba(92, 45, 84, 0.2);
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
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.driver-info p {
  margin: 4px 0 6px 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #5c2d54;
  font-weight: 700;
}

.phone-row ion-icon {
  font-size: 1.05rem;
}

.call-btn-link {
  text-decoration: none;
}

.call-action-btn {
  width: 48px; /* Increased to meet WCAG target size */
  height: 48px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #15803d; /* Darker green for higher contrast */
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
  padding: 8px 0;
}

.info-icon {
  font-size: 1.6rem;
  color: #5c2d54;
  background: rgba(92, 45, 84, 0.06);
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
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  font-weight: 750;
  color: #1e293b;
  line-height: 1.4;
}

.vertical-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 0 15px;
}

/* Timeline */
.timeline-container {
  position: relative;
  padding-left: 24px;
}

/* Glowing green progress track */
.timeline-container::before {
  content: '';
  position: absolute;
  left: 35px;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: linear-gradient(to bottom, #10b981 0%, #10b981 55%, #e2e8f0 55%, #e2e8f0 100%);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.3);
}

.timeline-step {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
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
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
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
  font-size: 1rem;
  font-weight: 750;
  color: #1e293b;
}

.step-content p {
  margin: 4px 0 0 0;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 500;
}

.timeline-step.active .step-content h4 {
  color: #10b981;
}

.empty-state-card {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 24px;
  color: #94a3b8;
  border: 1px solid rgba(0,0,0,0.02);
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
