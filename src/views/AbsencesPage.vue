<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Absences & Retards</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <!-- Student Header Badge -->
      <StudentHeaderBadge />

      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary"/>
        <p>Chargement des absences...</p>
      </div>

      <div v-else class="fade-in">
        <!-- Statistics Row Counters -->
        <div class="stats-row">
          <div class="stat-card absence-stat">
            <div class="stat-number">{{ absenceCount }}</div>
            <div class="stat-label">Absences</div>
          </div>
          <div class="stat-card late-stat">
            <div class="stat-number">{{ lateCount }}</div>
            <div class="stat-label">Retards</div>
          </div>
          <div class="stat-card ok-stat">
            <div class="stat-number">{{ justifiedCount }}</div>
            <div class="stat-label">Justifiées</div>
          </div>
        </div>

        <div v-if="attendances.length === 0" class="empty-state">
          🎉 Aucune absence enregistrée.
        </div>

        <div v-for="att in attendances" :key="att.id" class="premium-card attendance-card">
          <div class="att-badge" :class="att.type">
            <span>{{ att.type === 'absence' ? '🚫' : '⏰' }}</span>
            <small>{{ att.type === 'absence' ? 'Absence' : 'Retard' }}</small>
          </div>
          <div class="att-details">
            <h4>{{ att.reason || 'Motif non précisé' }}</h4>
            <p>{{ formatDatetime(att.date) }}</p>
            <span v-if="att.type === 'late' && att.duration" class="duration-chip">
              ⏱ {{ att.duration }} minutes
            </span>
          </div>
          <div class="justified-pill" :class="{ justified: att.is_justified }">
            {{ att.is_justified ? '✓ Justifié' : '✗ Non justifié' }}
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSpinner, IonButtons, IonMenuButton
} from '@ionic/vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const router = useRouter();
const attendances = ref<any[]>([]);
const loading = ref(true);

const absenceCount = computed(() => attendances.value.filter(a => a.type === 'absence').length);
const lateCount = computed(() => attendances.value.filter(a => a.type === 'late').length);
const justifiedCount = computed(() => attendances.value.filter(a => a.is_justified).length);

const formatDatetime = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const fetchData = async () => {
  const config = odoo.userConfig;
  if (!config) {
    router.replace('/login');
    return;
  }
  loading.value = true;
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });

    if (students && students.length > 0) {
      const selectedId = odoo.selectedStudentId;
      const student = students.find((s: any) => s.id === selectedId) || students[0];
      const bodyWithId = { student_id: student.id };
      attendances.value = await apiRequest('/api/school/attendance', bodyWithId);
    }
  } catch (e: any) {
    console.error('Erreur chargement absences:', e);
    if (e.message?.includes('401') || e.message?.includes('Not logged in')) {
      odoo.logout();
      router.replace('/login');
    }
  } finally {
    loading.value = false;
  }
};

const handleStudentChanged = () => {
  fetchData();
};

onMounted(() => {
  fetchData();
  window.addEventListener('student-changed', handleStudentChanged);
});

onUnmounted(() => {
  window.removeEventListener('student-changed', handleStudentChanged);
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

/* Loading */
.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 15px;
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 1rem;
  font-weight: 500;
}

/* Absences - Stats */
.stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px 10px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.stat-number { font-size: 1.8rem; font-weight: 800; }
.stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-top: 2px; }
.absence-stat .stat-number { color: #ef4444; }
.late-stat .stat-number    { color: #f59e0b; }
.ok-stat .stat-number      { color: #10b981; }

/* Absences - Cards */
.attendance-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #ffffff;
}
.att-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  flex-shrink: 0;
}
.att-badge span { font-size: 1.3rem; }
.att-badge small { font-size: 0.55rem; font-weight: 700; text-transform: uppercase; }
.att-badge.absence { background: #fef2f2; color: #ef4444; }
.att-badge.late    { background: #fffbeb; color: #d97706; }

.att-details { flex: 1; min-width: 0; }
.att-details h4 { margin: 0; font-weight: 700; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.att-details p  { margin: 2px 0 0; font-size: 0.75rem; color: #94a3b8; }
.duration-chip  { display: inline-block; margin-top: 4px; font-size: 0.72rem; font-weight: 700; color: #d97706; background: #fffbeb; padding: 2px 8px; border-radius: 20px; }

.justified-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
  background: #fef2f2;
  color: #ef4444;
  white-space: nowrap;
  flex-shrink: 0;
}
.justified-pill.justified { background: #f0fdf4; color: #10b981; }
</style>
