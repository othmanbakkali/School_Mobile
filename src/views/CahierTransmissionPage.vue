<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Cahier de Transmission</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <div class="page-hero">
          <div class="hero-icon">📓</div>
          <h1>Cahier de Transmission</h1>
          <p>Communications entre l'école et les parents</p>
        </div>

        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
          <p>Chargement...</p>
        </div>

        <div v-else-if="entries.length === 0" class="empty-state-card">
          <ion-icon :icon="bookOutline" class="empty-icon"></ion-icon>
          <p>Aucune entrée dans le cahier de transmission.</p>
        </div>

        <div v-else>
          <div v-for="entry in entries" :key="entry.id" class="premium-card transmission-card">
            <div class="card-badge" :class="entry.type || 'info'">
              <span>{{ getTypeIcon(entry.type) }}</span>
              <small>{{ getTypeLabel(entry.type) }}</small>
            </div>
            <div class="card-body">
              <h3>{{ entry.title || entry.subject || 'Message' }}</h3>
              <p>{{ entry.content || entry.body || entry.description }}</p>
              <div class="card-meta">
                <span class="meta-author">
                  <ion-icon :icon="personOutline"></ion-icon>
                  {{ entry.author || entry.teacher || 'Enseignant' }}
                </span>
                <span class="meta-date">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  {{ formatDate(entry.date || entry.create_date) }}
                </span>
              </div>
              <div v-if="entry.requires_signature" class="signature-row">
                <ion-chip :color="entry.signed ? 'success' : 'warning'" class="sig-chip">
                  <ion-icon :icon="entry.signed ? checkmarkCircleOutline : alertCircleOutline"></ion-icon>
                  <ion-label>{{ entry.signed ? 'Lu et signé' : 'Signature requise' }}</ion-label>
                </ion-chip>
                <ion-button v-if="!entry.signed" size="small" @click="signEntry(entry)">
                  Signer
                </ion-button>
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
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
  IonChip, IonLabel, IonButton, onIonViewWillEnter, toastController
} from '@ionic/vue';
import { bookOutline, personOutline, calendarOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const entries = ref<any[]>([]);
const loading = ref(true);

const getTypeIcon = (type: string) => {
  const icons: any = { info: 'ℹ️', warning: '⚠️', urgent: '🚨', homework: '📚', event: '📅' };
  return icons[type] || '📓';
};

const getTypeLabel = (type: string) => {
  const labels: any = { info: 'Information', warning: 'Avertissement', urgent: 'Urgent', homework: 'Devoir', event: 'Événement' };
  return labels[type] || 'Message';
};

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
};

const signEntry = async (entry: any) => {
  try {
    await apiRequest('/api/school/cahier-transmission/sign', { entry_id: entry.id });
    entry.signed = true;
    const toast = await toastController.create({ message: 'Signé avec succès !', duration: 2000, color: 'success', position: 'top' });
    await toast.present();
  } catch (e) {
    console.error(e);
  }
};

const fetchData = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) { router.replace('/login'); return; }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    const selectedId = odoo.selectedStudentId;
    const student = students.find((s: any) => s.id === selectedId) || students[0];
    if (student) {
      entries.value = await apiRequest('/api/school/cahier-transmission', { student_id: student.id });
    }
  } catch (e) {
    console.error(e);
    // Use demo data if API not available
    entries.value = [
      { id: 1, type: 'info', title: 'Sortie scolaire', content: 'Une sortie au musée est prévue le 15 juin. Merci de signer l\'autorisation.', author: 'Mme. Martin', date: new Date().toISOString(), requires_signature: true, signed: false },
      { id: 2, type: 'homework', title: 'Contrôle de Mathématiques', content: 'Un contrôle de mathématiques aura lieu vendredi prochain. Réviser les chapitres 3 et 4.', author: 'M. Dubois', date: new Date(Date.now() - 86400000).toISOString(), requires_signature: false },
      { id: 3, type: 'warning', title: 'Retard répété', content: 'Votre enfant a été en retard 3 fois cette semaine. Merci de prendre les dispositions nécessaires.', author: 'Direction', date: new Date(Date.now() - 2 * 86400000).toISOString(), requires_signature: true, signed: true },
    ];
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => fetchData());
onMounted(() => fetchData());
</script>

<style scoped>
.gray-bg { --background: #f8fafc; }

.page-hero {
  text-align: center;
  padding: 20px 0 30px;
}
.hero-icon { font-size: 3rem; margin-bottom: 10px; }
.page-hero h1 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1e293b; }
.page-hero p { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; }

.loading-center { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 15px; color: #94a3b8; }

.empty-state-card {
  text-align: center; padding: 50px 20px;
  background: white; border-radius: 20px;
  color: #94a3b8;
}
.empty-icon { font-size: 3rem; color: #cbd5e1; margin-bottom: 10px; display: block; }

.transmission-card {
  margin-bottom: 16px;
  background: white;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.card-badge {
  width: 70px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 15px 5px;
}
.card-badge span { font-size: 1.5rem; }
.card-badge small { font-size: 0.55rem; font-weight: 800; text-transform: uppercase; text-align: center; }
.card-badge.info { background: #eff6ff; color: #3b82f6; }
.card-badge.warning { background: #fffbeb; color: #d97706; }
.card-badge.urgent { background: #fef2f2; color: #ef4444; }
.card-badge.homework { background: #f5f3ff; color: #6366f1; }
.card-badge.event { background: #f0fdf4; color: #10b981; }

.card-body { flex: 1; padding: 15px; }
.card-body h3 { margin: 0 0 6px; font-weight: 700; font-size: 1rem; color: #1e293b; }
.card-body > p { margin: 0 0 12px; font-size: 0.875rem; color: #475569; line-height: 1.5; }

.card-meta { display: flex; gap: 15px; flex-wrap: wrap; }
.meta-author, .meta-date {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.75rem; color: #94a3b8; font-weight: 600;
}
.meta-author ion-icon, .meta-date ion-icon { font-size: 0.85rem; }

.signature-row {
  display: flex; align-items: center; gap: 10px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}
.sig-chip { height: 28px; font-size: 0.75rem; }
</style>
