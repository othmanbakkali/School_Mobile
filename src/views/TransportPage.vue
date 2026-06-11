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
            <a :href="'tel:' + transportData.driver_phone" class="call-btn-link" v-if="transportData.driver_phone">
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
  margin: 10px 0 25px 0;
  padding: 15px;
}

.hero-icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

.page-hero h1 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.page-hero p {
  color: #64748b;
  margin: 5px 0 0;
  font-size: 0.95rem;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 25px 5px 12px 5px;
}

.premium-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  margin-bottom: 15px;
}

.driver-profile {
  display: flex;
  align-items: center;
  gap: 15px;
}

.driver-avatar-box {
  position: relative;
  flex-shrink: 0;
}

.driver-avatar-initials {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.15rem;
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
}

.driver-avatar-box .status-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid white;
}

.driver-info {
  flex: 1;
}

.driver-info h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.driver-info p {
  margin: 2px 0 6px 0;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #6366f1;
  font-weight: 600;
}

.phone-row ion-icon {
  font-size: 0.95rem;
}

.call-btn-link {
  text-decoration: none;
}

.call-action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: 0 4px 8px rgba(22, 163, 74, 0.1);
  transition: transform 0.2s;
}

.call-action-btn:active {
  transform: scale(0.92);
}

.info-row {
  display: flex;
  align-items: stretch;
}

.info-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 0;
}

.info-icon {
  font-size: 1.6rem;
  color: #6366f1;
  background: #eff6ff;
  padding: 8px;
  border-radius: 12px;
  flex-shrink: 0;
}

.info-text span {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}

.info-text p {
  margin: 2px 0 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  line-height: 1.3;
}

.vertical-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 0 15px;
}

/* Timeline */
.timeline-container {
  position: relative;
  padding-left: 20px;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 31px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #e2e8f0;
}

.timeline-step {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  position: relative;
}

.timeline-step:last-child {
  margin-bottom: 0;
}

.step-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e2e8f0;
  z-index: 1;
  flex-shrink: 0;
}

.timeline-step.done .step-marker {
  background: #16a34a;
  color: white;
  box-shadow: 0 0 0 2px #16a34a;
}

.timeline-step.active .step-marker {
  background: #6366f1;
  font-size: 0.95rem;
  width: 28px;
  height: 28px;
  margin-left: -2px;
  box-shadow: 0 0 0 2px #6366f1;
}

.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

.step-content h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.step-content p {
  margin: 3px 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.timeline-step.active .step-content h4 {
  color: #6366f1;
}

.empty-state-card {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 10px;
  display: block;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: #64748b;
}
</style>
