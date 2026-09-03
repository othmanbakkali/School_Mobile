<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Notes & Évaluations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary"/>
        <p>Chargement des notes...</p>
      </div>

      <div v-else class="fade-in">
        <!-- Semester Selection Filter -->
        <div class="semester-filter">
          <ion-segment v-model="selectedSemester" mode="ios" class="mini-segment">
            <ion-segment-button value="S1">
              <ion-label>Semestre 1</ion-label>
            </ion-segment-button>
            <ion-segment-button value="S2">
              <ion-label>Semestre 2</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <div v-if="filteredNotes.length === 0" class="empty-state">
          📝 Aucune note pour ce semestre.
        </div>
        
        <div v-for="note in filteredNotes" :key="note.id" class="premium-card note-card-detailed">
          <div class="note-header">
            <div class="subject-info-box">
              <span class="subject-title">{{ note.subject || 'Matière' }}</span>
              <span v-if="note.sub_subject" class="sub-subject-pill">{{ note.sub_subject }}</span>
            </div>
            <div class="final-score-box" :class="getGradeClass(note.final_mark, note.grade_scale)">
              <span class="final-val">{{ note.final_mark }}</span>
              <span class="final-scale">/{{ note.grade_scale || '20' }}</span>
            </div>
          </div>
          <div class="marks-grid">
            <div class="mark-sub">
              <span class="mark-label">CC1</span>
              <span class="mark-val">{{ note.cc1 || 0 }}</span>
            </div>
            <div class="mark-sub">
              <span class="mark-label">CC2</span>
              <span class="mark-val">{{ note.cc2 || 0 }}</span>
            </div>
            <div class="mark-sub">
              <span class="mark-label">Oral</span>
              <span class="mark-val">{{ note.oral_mark || 0 }}</span>
            </div>
            <div class="mark-sub">
              <span class="mark-label">Partiel</span>
              <span class="mark-val">{{ note.mid_term_mark || 0 }}</span>
            </div>
          </div>
          <div v-if="note.observation || note.remark" class="note-remark-box">
            <p class="remark-text">💬 {{ note.observation || note.remark }}</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonButtons, IonMenuButton
} from '@ionic/vue';
import { ref, computed, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const notes = ref<any[]>([]);
const loading = ref(true);
const selectedSemester = ref('S1');

const filteredNotes = computed(() => {
  return notes.value.filter(n => n.semester === selectedSemester.value);
});

const getGradeClass = (val: number, scale?: string) => {
  if (scale === '10') {
    if (val >= 8) return 'grade-high';
    if (val >= 5) return 'grade-mid';
    return 'grade-low';
  }
  if (val >= 16) return 'grade-high';
  if (val >= 10) return 'grade-mid';
  return 'grade-low';
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
      notes.value = await apiRequest('/api/school/grades', bodyWithId);
    }
  } catch (e: any) {
    console.error('Erreur chargement notes:', e);
    if (e.message?.includes('401') || e.message?.includes('Not logged in')) {
      odoo.logout();
      router.replace('/login');
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
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

/* Notes */
.semester-filter {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.mini-segment {
  width: 100%;
  max-width: 280px;
  --background: #e2e8f0;
}
.note-card-detailed {
  margin-bottom: 16px;
  padding: 16px;
  background: #ffffff;
}
.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e2e8f0;
}
.subject-info-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.subject-title {
  font-weight: 800;
  color: #1e293b;
  font-size: 1.05rem;
}
.sub-subject-pill {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 6px;
}
.final-score-box {
  padding: 6px 12px;
  border-radius: 10px;
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-weight: 800;
}
.final-val {
  font-size: 1.15rem;
}
.final-scale {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 700;
}
.marks-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.mark-sub {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8fafc;
  padding: 8px;
  border-radius: 8px;
}
.mark-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
}
.mark-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: #334155;
  margin-top: 2px;
}
.grade-high { background: #f0fdf4; color: #10b981; }
.grade-mid  { background: #eff6ff; color: #3b82f6; }
.grade-low  { background: #fef2f2; color: #ef4444; }
</style>
