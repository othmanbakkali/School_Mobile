<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title class="page-title">
          <span class="title-main">Notes & Bulletins</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding custom-content">
      <!-- Student Header Badge (Name, Class, Switcher) -->
      <StudentHeaderBadge />

      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary" />
        <p class="loading-text">Chargement des notes et sous-matières...</p>
      </div>

      <div v-else class="fade-in">
        <!-- Semester Selection Filter -->
        <div class="semester-filter-wrapper">
          <ion-segment v-model="selectedSemester" mode="ios" class="custom-segment">
            <ion-segment-button value="S1">
              <ion-label>Semestre 1</ion-label>
            </ion-segment-button>
            <ion-segment-button value="S2">
              <ion-label>Semestre 2</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Global Semester Average Card -->
        <div v-if="filteredNotes.length > 0" class="premium-card overview-card">
          <div class="overview-decoration"></div>
          <div class="overview-header">
            <div class="overview-info">
              <span class="overview-subtitle">Synthèse {{ selectedSemester === 'S1' ? '1er Semestre' : '2ème Semestre' }}</span>
              <h2 class="overview-title">Moyenne Générale</h2>
            </div>
            <div class="overview-badge" :class="getGradeClass(semesterAverage, gradeScale)">
              <span class="badge-appreciation">{{ getAppreciation(semesterAverage, gradeScale) }}</span>
            </div>
          </div>

          <div class="overview-body">
            <div class="average-display">
              <span class="average-value">{{ formatMark(semesterAverage) }}</span>
              <span class="average-scale">/{{ gradeScale }}</span>
            </div>
            <div class="average-meta">
              <div class="meta-item">
                <span class="meta-label">Matières</span>
                <span class="meta-val">{{ filteredNotes.length }}</span>
              </div>
              <div class="meta-divider"></div>
              <div class="meta-item">
                <span class="meta-label">Sous-matières</span>
                <span class="meta-val">{{ totalSubSectionsCount }}</span>
              </div>
            </div>
          </div>

          <div class="overview-footer">
            <div class="progress-bar-container">
              <div class="progress-bar-fill" :style="{ width: getProgressPercent(semesterAverage, gradeScale) + '%', background: getGradeColor(semesterAverage, gradeScale) }"></div>
            </div>
            <p class="overview-hint">
              💡 La note de chaque matière est calculée automatiquement comme la moyenne de ses sous-matières.
            </p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredNotes.length === 0" class="empty-state-card">
          <div class="empty-icon">📝</div>
          <h3>Aucune note disponible</h3>
          <p>Aucune évaluation n'a été enregistrée pour ce semestre.</p>
        </div>

        <!-- Subjects List with Sub-sections Accordion -->
        <div class="subjects-container" v-else>
          <div class="section-title-box">
            <h3 class="section-title">Table des Matières & Sous-matières</h3>
            <span class="section-counter">{{ filteredNotes.length }} matières</span>
          </div>

          <div 
            v-for="note in filteredNotes" 
            :key="note.id || note.subject" 
            class="premium-card subject-card"
            :class="{ 'is-expanded': isExpanded(note.subject_id || note.subject) }"
          >
            <!-- Parent Subject Header -->
            <div class="subject-header" @click="toggleSubject(note.subject_id || note.subject)">
              <div class="subject-main-info">
                <div class="subject-icon-box" :style="{ background: getSubjectColor(note.subject).bg, color: getSubjectColor(note.subject).color }">
                  {{ getSubjectIcon(note.subject) }}
                </div>
                <div class="subject-text-box">
                  <h4 class="subject-name">{{ note.subject }}</h4>
                  <div class="subject-meta-tags">
                    <span v-if="note.sub_sections_count > 0" class="sub-count-tag">
                      {{ note.sub_sections_count }} sous-matières
                    </span>
                    <span v-else class="sub-count-tag">
                      Évaluation directe
                    </span>
                  </div>
                </div>
              </div>

              <!-- Parent Subject Global Average Score -->
              <div class="subject-score-wrapper">
                <div class="parent-average-tag">
                  <span class="avg-label">Moyenne Matière</span>
                  <div class="parent-score-box" :class="getGradeClass(note.final_mark, note.grade_scale || gradeScale)">
                    <span class="score-val">{{ formatMark(note.final_mark) }}</span>
                    <span class="score-scale">/{{ note.grade_scale || gradeScale }}</span>
                  </div>
                </div>
                <div class="expand-btn">
                  <ion-icon :icon="isExpanded(note.subject_id || note.subject) ? chevronUpOutline : chevronDownOutline" />
                </div>
              </div>
            </div>

            <!-- Quick Marks Summary Bar (CC1, CC2, Oral, Partiel averages) -->
            <div class="marks-quick-grid">
              <div class="quick-mark-item">
                <span class="quick-label">CC1</span>
                <span class="quick-val">{{ formatMark(note.cc1) }}</span>
              </div>
              <div class="quick-mark-item">
                <span class="quick-label">CC2</span>
                <span class="quick-val">{{ formatMark(note.cc2) }}</span>
              </div>
              <div class="quick-mark-item">
                <span class="quick-label">Oral</span>
                <span class="quick-val">{{ formatMark(note.oral_mark) }}</span>
              </div>
              <div class="quick-mark-item">
                <span class="quick-label">Partiel</span>
                <span class="quick-val">{{ formatMark(note.mid_term_mark) }}</span>
              </div>
            </div>

            <!-- Accordion Details: Sub-sections list -->
            <div v-show="isExpanded(note.subject_id || note.subject)" class="sub-sections-drawer">
              <div class="drawer-divider"></div>
              
              <div class="drawer-header">
                <div class="drawer-header-left">
                  <span class="drawer-badge-icon">📑</span>
                  <span class="drawer-title">Sous-matières ({{ note.sub_sections ? note.sub_sections.length : 0 }})</span>
                </div>
                <span class="drawer-formula">Moyenne = Note Matière</span>
              </div>

              <div v-if="!note.sub_sections || note.sub_sections.length === 0" class="empty-subsections">
                <p>Aucune sous-matière spécifique renseignée pour cette matière.</p>
              </div>

              <div v-else class="sub-sections-list">
                <div 
                  v-for="(sub, sIdx) in note.sub_sections" 
                  :key="sub.id || sIdx" 
                  class="sub-section-row"
                >
                  <div class="sub-left">
                    <div class="sub-number-badge">{{ sIdx + 1 }}</div>
                    <div class="sub-details">
                      <!-- Sub-matter Name prominently displayed -->
                      <span class="sub-name">{{ sub.name }}</span>
                      <div class="sub-marks-badges">
                        <span class="mini-mark-pill">CC1: <strong>{{ formatMark(sub.cc1) }}</strong></span>
                        <span class="mini-mark-pill">CC2: <strong>{{ formatMark(sub.cc2) }}</strong></span>
                        <span v-if="sub.oral_mark > 0" class="mini-mark-pill">Oral: <strong>{{ formatMark(sub.oral_mark) }}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div class="sub-right">
                    <div class="sub-final-score" :class="getGradeClass(sub.final_mark, gradeScale)">
                      <span class="sub-val">{{ formatMark(sub.final_mark) }}</span>
                      <span class="sub-scale">/{{ gradeScale }}</span>
                    </div>
                    <div class="sub-progress-bar">
                      <div class="sub-progress-fill" :style="{ width: getProgressPercent(sub.final_mark, gradeScale) + '%', background: getGradeColor(sub.final_mark, gradeScale) }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Summary Card for Parent Subject Global Average -->
              <div class="drawer-summary-card">
                <div class="summary-card-inner">
                  <span class="summary-icon">⚖️</span>
                  <div class="summary-text-box">
                    <span class="summary-heading">Note Moyenne Globale : {{ note.subject }}</span>
                    <span class="summary-text">
                      <strong>{{ formatMark(note.final_mark) }} / {{ note.grade_scale || gradeScale }}</strong>
                      <span class="summary-detail-sub"> — Moyenne arithmétique de ses {{ note.sub_sections ? note.sub_sections.length : 0 }} sous-matières.</span>
                    </span>
                  </div>
                </div>
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
  IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonButtons, IonMenuButton, IonIcon
} from '@ionic/vue';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const router = useRouter();
const notes = ref<any[]>([]);
const loading = ref(true);
const selectedSemester = ref('S1');
const expandedSubjects = ref<Set<string | number>>(new Set());
const gradeScale = ref('20');

const filteredNotes = computed(() => {
  return notes.value.filter(n => n.semester === selectedSemester.value);
});

const totalSubSectionsCount = computed(() => {
  return filteredNotes.value.reduce((acc, n) => acc + (n.sub_sections_count || (n.sub_sections ? n.sub_sections.length : 0)), 0);
});

const semesterAverage = computed(() => {
  if (filteredNotes.value.length === 0) return 0;
  const sum = filteredNotes.value.reduce((acc, n) => acc + (parseFloat(n.final_mark) || 0), 0);
  return Math.round((sum / filteredNotes.value.length) * 100) / 100;
});

const isExpanded = (id: string | number) => {
  return expandedSubjects.value.has(id);
};

const toggleSubject = (id: string | number) => {
  if (expandedSubjects.value.has(id)) {
    expandedSubjects.value.delete(id);
  } else {
    expandedSubjects.value.add(id);
  }
};

const formatMark = (val: any) => {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = parseFloat(val);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

const getProgressPercent = (val: number, scale = '20') => {
  const max = parseFloat(scale) || 20;
  const clamped = Math.min(Math.max(val || 0, 0), max);
  return (clamped / max) * 100;
};

const getGradeClass = (val: number, scale = '20') => {
  const max = parseFloat(scale) || 20;
  const ratio = (val || 0) / max;
  if (ratio >= 0.8) return 'grade-high';
  if (ratio >= 0.5) return 'grade-mid';
  return 'grade-low';
};

const getGradeColor = (val: number, scale = '20') => {
  const max = parseFloat(scale) || 20;
  const ratio = (val || 0) / max;
  if (ratio >= 0.8) return '#10b981';
  if (ratio >= 0.5) return '#3b82f6';
  return '#ef4444';
};

const getAppreciation = (val: number, scale = '20') => {
  const max = parseFloat(scale) || 20;
  const ratio = (val || 0) / max;
  if (ratio >= 0.85) return 'Excellent';
  if (ratio >= 0.75) return 'Très Bien';
  if (ratio >= 0.65) return 'Bien';
  if (ratio >= 0.50) return 'Satisfaisant';
  return 'À Encourager';
};

const getSubjectIcon = (subjectName = '') => {
  const s = subjectName.toLowerCase();
  if (s.includes('arabe') || s.includes('عرب')) return '📖';
  if (s.includes('français') || s.includes('francais')) return '🇫🇷';
  if (s.includes('math') || s.includes('رياض')) return '📐';
  if (s.includes('islam') || s.includes('إسلام')) return '🕌';
  if (s.includes('histoire') || s.includes('geo') || s.includes('اجتماع')) return '🌍';
  if (s.includes('science') || s.includes('svt') || s.includes('علم')) return '🔬';
  if (s.includes('art') || s.includes('eps') || s.includes('فن') || s.includes('بدن')) return '🎨';
  if (s.includes('english') || s.includes('anglais')) return '🇬🇧';
  return '📚';
};

const getSubjectColor = (subjectName = '') => {
  const s = subjectName.toLowerCase();
  if (s.includes('arabe') || s.includes('عرب')) return { bg: '#ecfdf5', color: '#059669' };
  if (s.includes('français') || s.includes('francais')) return { bg: '#eff6ff', color: '#2563eb' };
  if (s.includes('math') || s.includes('رياض')) return { bg: '#fef3c7', color: '#d97706' };
  if (s.includes('islam') || s.includes('إسلام')) return { bg: '#f0fdf4', color: '#16a34a' };
  if (s.includes('histoire') || s.includes('geo') || s.includes('اجتماع')) return { bg: '#faf5ff', color: '#9333ea' };
  if (s.includes('science') || s.includes('svt') || s.includes('علم')) return { bg: '#ecfeff', color: '#0891b2' };
  if (s.includes('art') || s.includes('eps') || s.includes('فن') || s.includes('بدن')) return { bg: '#fff1f2', color: '#e11d48' };
  if (s.includes('english') || s.includes('anglais')) return { bg: '#fdf2f8', color: '#db2777' };
  return { bg: '#f1f5f9', color: '#475569' };
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
      const res = await apiRequest('/api/school/grades', bodyWithId);
      notes.value = Array.isArray(res) ? res : [];
      if (notes.value.length > 0 && notes.value[0].grade_scale) {
        gradeScale.value = notes.value[0].grade_scale;
      }
      // Expand the first subject by default for immediate discoverability
      if (filteredNotes.value.length > 0) {
        const first = filteredNotes.value[0];
        expandedSubjects.value.add(first.subject_id || first.subject);
      }
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
.custom-content {
  --background: #f8fafc;
}

.page-title {
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

/* Loading */
.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: #64748b;
}

.loading-text {
  font-size: 0.95rem;
  font-weight: 600;
}

/* Semester Filter */
.semester-filter-wrapper {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.custom-segment {
  width: 100%;
  max-width: 320px;
  --background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
}

/* Overview Banner Card */
.overview-card {
  position: relative;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  padding: 22px;
  color: #ffffff;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
}

.overview-decoration {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%);
  border-radius: 50%;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.overview-subtitle {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 700;
}

.overview-title {
  margin: 4px 0 0 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
}

.overview-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.overview-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 18px;
}

.average-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.average-value {
  font-size: 2.7rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
  color: #ffffff;
}

.average-scale {
  font-size: 1.1rem;
  font-weight: 700;
  color: #94a3b8;
}

.average-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.08);
  padding: 8px 14px;
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.meta-label {
  font-size: 0.68rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
}

.meta-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
}

.meta-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
}

.overview-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.overview-hint {
  margin: 0;
  font-size: 0.76rem;
  color: #cbd5e1;
  font-weight: 500;
}

/* Empty State */
.empty-state-card {
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-state-card h3 {
  margin: 0 0 6px 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.empty-state-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Subjects Section */
.section-title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 4px 14px 4px;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.section-counter {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 12px;
}

.subject-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: all 0.25s ease;
}

.subject-card.is-expanded {
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
}

.subject-main-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.subject-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.subject-text-box {
  flex: 1;
  min-width: 0;
}

.subject-name {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject-meta-tags {
  display: flex;
  gap: 6px;
}

.sub-count-tag {
  font-size: 0.73rem;
  color: #64748b;
  font-weight: 600;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.subject-score-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.parent-average-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.avg-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.parent-score-box {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 900;
}

.score-val {
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.score-scale {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.8;
}

.expand-btn {
  color: #94a3b8;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Quick Marks Grid */
.marks-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.quick-mark-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  padding: 6px 4px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.quick-label {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
}

.quick-val {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f172a;
}

/* Drawer: Sub-sections list */
.sub-sections-drawer {
  background: #fafafa;
  padding: 14px 16px 16px 16px;
  border-top: 1px solid #e2e8f0;
}

.drawer-divider {
  display: none;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.drawer-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.drawer-badge-icon {
  font-size: 1.05rem;
}

.drawer-title {
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
}

.drawer-formula {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 3px 8px;
  border-radius: 6px;
}

.empty-subsections {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.sub-sections-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.sub-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.sub-number-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sub-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sub-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-marks-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mini-mark-pill {
  font-size: 0.7rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 6px;
}

.mini-mark-pill strong {
  color: #0f172a;
}

.sub-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 70px;
  flex-shrink: 0;
}

.sub-final-score {
  display: flex;
  align-items: baseline;
  gap: 1px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 800;
}

.sub-val {
  font-size: 0.95rem;
}

.sub-scale {
  font-size: 0.7rem;
  opacity: 0.75;
}

.sub-progress-bar {
  width: 60px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.sub-progress-fill {
  height: 100%;
  border-radius: 4px;
}

/* Summary Card */
.drawer-summary-card {
  margin-top: 14px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
}

.summary-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.summary-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.summary-text-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-heading {
  font-size: 0.8rem;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.summary-text {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.4;
}

.summary-text strong {
  color: #0f172a;
  font-size: 0.92rem;
}

.summary-detail-sub {
  color: #64748b;
  font-size: 0.78rem;
}

/* Grade Classes */
.grade-high {
  background: #ecfdf5;
  color: #059669;
}

.grade-mid {
  background: #eff6ff;
  color: #2563eb;
}

.grade-low {
  background: #fef2f2;
  color: #dc2626;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
