<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('suivi.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Hero Header -->
        <div class="page-hero">
          <div class="hero-icon-box">🎓</div>
          <h1>{{ t('suivi.title') }}</h1>
          <p>{{ t('suivi.subtitle') }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
          <p class="loading-text">{{ t('suivi.loading') }}</p>
        </div>

        <div v-else class="content-wrapper">
          <!-- ========================================== -->
          <!-- 1. COMPORTEMENT & ASSIDUITÉ                -->
          <!-- ========================================== -->
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-icon">🌟</span>
              <div>
                <h2>{{ t('suivi.behaviourTitle') }}</h2>
                <p class="section-subtitle">{{ t('suivi.behaviourDesc') }}</p>
              </div>
            </div>
            <!-- Teacher Admin Button -->
            <button class="admin-action-btn" @click="openEvalModal">
              <ion-icon :icon="createOutline" />
              <span>{{ t('suivi.evalBehaviourBtn') }}</span>
            </button>
          </div>

          <div class="premium-card behaviour-card ion-padding">
            <div class="behaviour-header-meta" v-if="behaviourData.teacher_name || behaviourData.date">
              <span class="eval-by-tag">
                👨‍🏫 {{ behaviourData.teacher_name ? behaviourData.teacher_name : 'Équipe pédagogique' }}
              </span>
              <span class="eval-date-tag" v-if="behaviourData.date">
                📅 {{ formatDate(behaviourData.date) }} ({{ behaviourData.semester === 'S2' ? 'Semestre 2' : 'Semestre 1' }})
              </span>
            </div>

            <div class="behaviour-row" v-for="item in behaviourItems" :key="item.key">
              <div class="beh-info">
                <span class="beh-icon">{{ item.icon }}</span>
                <span class="beh-label">{{ item.label }}</span>
              </div>
              <div class="beh-actions">
                <div class="beh-stars">
                  <span v-for="n in 5" :key="n" :class="['star', { active: n <= item.value }]">★</span>
                </div>
                <span class="beh-score">{{ item.value }}/5</span>
              </div>
            </div>

            <!-- Global Appreciation Observation -->
            <div class="behaviour-appreciation-box" v-if="behaviourData.general_appreciation">
              <span class="appreciation-icon">💬</span>
              <div class="appreciation-body">
                <span class="appreciation-label">Appréciation globale du comportement :</span>
                <p class="appreciation-text">« {{ behaviourData.general_appreciation }} »</p>
              </div>
            </div>
          </div>

          <!-- ========================================== -->
          <!-- 2. PROGRESSION PAR MATIÈRE (SYNCHRONISÉE)  -->
          <!-- ========================================== -->
          <div class="section-header" style="margin-top: 28px;">
            <div class="section-title-wrap">
              <span class="section-icon">📊</span>
              <div>
                <h2>{{ t('suivi.progressTitle') }}</h2>
                <p class="section-subtitle">{{ t('suivi.progressDesc') }}</p>
              </div>
            </div>

            <!-- Semester Filter Switcher -->
            <div class="progress-sem-filter">
              <button 
                class="sem-filter-pill" 
                :class="{ 'active': selectedSemester === 'S1' }"
                @click="selectedSemester = 'S1'"
              >
                S1
              </button>
              <button 
                class="sem-filter-pill" 
                :class="{ 'active': selectedSemester === 'S2' }"
                @click="selectedSemester = 'S2'"
              >
                S2
              </button>
              <button 
                class="sem-filter-pill" 
                :class="{ 'active': selectedSemester === 'all' }"
                @click="selectedSemester = 'all'"
              >
                Année
              </button>
            </div>
          </div>

          <div v-if="filteredSubjects.length === 0" class="empty-card">
            <span class="empty-icon">📝</span>
            <p>{{ t('suivi.emptyProgress') }}</p>
          </div>

          <div v-else class="premium-card ion-padding subject-progress-card">
            <div v-for="sub in filteredSubjects" :key="sub.name" class="subject-row">
              <div class="sub-info">
                <div class="sub-name-group">
                  <span class="sub-icon">{{ getSubjectIcon(sub.name) }}</span>
                  <span class="sub-name" :class="{ 'ar-text': isArabic(sub.name) }">{{ sub.name }}</span>
                </div>
                <span class="sub-grade-badge" :class="getGradeClass(sub.avg, sub.gradeScale)">
                  {{ typeof sub.avg === 'number' ? sub.avg.toFixed(2) : sub.avg }} / {{ sub.gradeScale || 20 }}
                </span>
              </div>

              <div class="progress-bar-track">
                <div 
                  class="progress-bar-fill" 
                  :style="{ width: Math.min(100, Math.max(5, (sub.avg / (sub.gradeScale || 20) * 100))) + '%', background: getGradeColor(sub.avg, sub.gradeScale) }"
                ></div>
              </div>

              <div class="sub-footer">
                <div class="sub-trend" :class="sub.trend > 0 ? 'up' : sub.trend < 0 ? 'down' : 'flat'">
                  <span v-if="sub.trend > 0">▲ +{{ sub.trend.toFixed(1) }} {{ t('suivi.points') }}</span>
                  <span v-else-if="sub.trend < 0">▼ {{ sub.trend.toFixed(1) }} {{ t('suivi.points') }}</span>
                  <span v-else>◆ Régulier</span>
                </div>
                <span class="sub-status-label" :class="getGradeClass(sub.avg, sub.gradeScale)">
                  {{ getGradeAppraisal(sub.avg, sub.gradeScale) }}
                </span>
              </div>
            </div>
          </div>

          <!-- ========================================== -->
          <!-- 3. REMARQUES & APPRÉCIATIONS ENSEIGNANTS    -->
          <!-- ========================================== -->
          <div class="section-header" style="margin-top: 28px;">
            <div class="section-title-wrap">
              <span class="section-icon">💬</span>
              <div>
                <h2>{{ t('suivi.commentsTitle') }}</h2>
                <p class="section-subtitle">{{ t('suivi.commentsDesc') }}</p>
              </div>
            </div>

            <!-- Add Remark Button -->
            <button class="admin-action-btn secondary" @click="openCommentModal">
              <ion-icon :icon="chatbubbleEllipsesOutline" />
              <span>{{ t('suivi.addCommentBtn') }}</span>
            </button>
          </div>

          <div v-if="comments.length === 0" class="empty-card">
            <span class="empty-icon">💭</span>
            <p>{{ t('suivi.emptyComments') }}</p>
          </div>

          <div v-else class="comments-list">
            <div 
              v-for="c in comments" 
              :key="c.id" 
              class="premium-card comment-card"
              :class="'border-' + (c.sentiment || 'neutral')"
            >
              <div class="comment-header">
                <div class="teacher-avatar">{{ getInitials(c.teacher) }}</div>
                <div class="comment-meta">
                  <strong :class="{ 'ar-text': isArabic(c.teacher) }">{{ c.teacher }}</strong>
                  <span class="comment-sub">
                    <span class="subject-tag">{{ c.subject || 'Général' }}</span>
                    <span class="separator">·</span>
                    <span class="date-tag">{{ formatDate(c.date) }}</span>
                  </span>
                </div>
                <div class="sentiment-badge" :class="'sentiment-' + (c.sentiment || 'neutral')">
                  {{ getSentimentLabel(c.sentiment) }}
                </div>
                <button class="comment-delete-btn" @click="confirmDeleteComment(c)" title="Supprimer">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>

              <!-- Comment Body with high readability -->
              <div 
                class="comment-box"
                :dir="isArabic(c.text) ? 'rtl' : 'ltr'"
                :class="{ 'ar-text': isArabic(c.text) }"
              >
                <p class="comment-text">{{ c.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: ÉVALUER LE COMPORTEMENT             -->
      <!-- ========================================== -->
      <ion-modal :is-open="showEvalModal" @didDismiss="closeEvalModal" class="suivi-modal">
        <div class="modal-wrapper-custom">
          <div class="modal-header-custom">
            <div class="modal-header-info">
              <div class="modal-icon-badge">🌟</div>
              <div>
                <h2 class="modal-title">{{ t('suivi.evalModalTitle') }}</h2>
                <p class="modal-subtitle">{{ t('suivi.evalModalDesc') }}</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="closeEvalModal">
              <ion-icon :icon="closeOutline" />
            </button>
          </div>

          <div class="modal-body-custom">
            <!-- Semestre & Enseignant -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Semestre</label>
                <select v-model="evalForm.semester" class="custom-select">
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nom de l'Enseignant</label>
                <input v-model="evalForm.teacher_name" type="text" class="custom-input" placeholder="Ex: Prof. Martin" />
              </div>
            </div>

            <!-- Star Rating Criteria -->
            <div class="criteria-eval-list">
              <div class="criterion-eval-row" v-for="crit in evalCriteria" :key="crit.key">
                <div class="crit-left">
                  <span class="crit-icon">{{ crit.icon }}</span>
                  <span class="crit-label">{{ crit.label }}</span>
                </div>
                <div class="crit-star-picker">
                  <button 
                    type="button" 
                    v-for="s in 5" 
                    :key="s" 
                    class="picker-star" 
                    :class="{ 'filled': s <= (evalForm as any)[crit.key] }"
                    @click="(evalForm as any)[crit.key] = s"
                  >
                    ★
                  </button>
                  <span class="picker-val-badge">{{ (evalForm as any)[crit.key] }}/5</span>
                </div>
              </div>
            </div>

            <!-- Appreciation Globale -->
            <div class="form-group">
              <label class="form-label">Appréciation globale du comportement</label>
              <textarea 
                v-model="evalForm.general_appreciation" 
                rows="3" 
                class="custom-textarea" 
                placeholder="Ex: Élève très discipliné, attentif et toujours ponctuel..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer-custom">
            <button class="btn-cancel" @click="closeEvalModal">Annuler</button>
            <button class="btn-submit" :disabled="savingEval" @click="submitEvalForm">
              <ion-spinner v-if="savingEval" name="crescent" class="btn-spinner" />
              <span v-else>{{ t('suivi.saveEvalBtn') }}</span>
            </button>
          </div>
        </div>
      </ion-modal>

      <!-- ========================================== -->
      <!-- MODAL: NOUVELLE REMARQUE PÉDAGOGIQUE       -->
      <!-- ========================================== -->
      <ion-modal :is-open="showCommentModal" @didDismiss="closeCommentModal" class="suivi-modal">
        <div class="modal-wrapper-custom">
          <div class="modal-header-custom">
            <div class="modal-header-info">
              <div class="modal-icon-badge">💬</div>
              <div>
                <h2 class="modal-title">{{ t('suivi.addCommentTitle') }}</h2>
                <p class="modal-subtitle">{{ t('suivi.addCommentDesc') }}</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="closeCommentModal">
              <ion-icon :icon="closeOutline" />
            </button>
          </div>

          <div class="modal-body-custom">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Matière</label>
                <select v-model="commentForm.subject" class="custom-select">
                  <option value="Général">Général / Vie scolaire</option>
                  <option v-for="s in availableSubjectNames" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Enseignant</label>
                <input v-model="commentForm.teacher" type="text" class="custom-input" placeholder="Ex: Professeur" />
              </div>
            </div>

            <!-- Sentiment / Ton de l'observation -->
            <div class="form-group">
              <label class="form-label">Appréciation / Ton de la remarque</label>
              <div class="sentiment-picker-row">
                <button 
                  type="button" 
                  class="sent-pick-btn positive" 
                  :class="{ 'selected': commentForm.sentiment === 'positive' }"
                  @click="commentForm.sentiment = 'positive'"
                >
                  👍 {{ t('suivi.positive') }}
                </button>
                <button 
                  type="button" 
                  class="sent-pick-btn neutral" 
                  :class="{ 'selected': commentForm.sentiment === 'neutral' }"
                  @click="commentForm.sentiment = 'neutral'"
                >
                  ℹ️ {{ t('suivi.neutral') }}
                </button>
                <button 
                  type="button" 
                  class="sent-pick-btn negative" 
                  :class="{ 'selected': commentForm.sentiment === 'negative' }"
                  @click="commentForm.sentiment = 'negative'"
                >
                  ⚠️ {{ t('suivi.negative') }}
                </button>
              </div>
            </div>

            <!-- Text Content -->
            <div class="form-group">
              <label class="form-label">Observation / Remarque détaillée</label>
              <textarea 
                v-model="commentForm.text" 
                rows="4" 
                class="custom-textarea" 
                placeholder="Ex: Très bonne participation ce mois-ci. Les devoirs sont bien soignés..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer-custom">
            <button class="btn-cancel" @click="closeCommentModal">Annuler</button>
            <button class="btn-submit" :disabled="savingComment" @click="submitCommentForm">
              <ion-spinner v-if="savingComment" name="crescent" class="btn-spinner" />
              <span v-else>{{ t('suivi.saveCommentBtn') }}</span>
            </button>
          </div>
        </div>
      </ion-modal>

      <!-- Delete Comment Alert -->
      <ion-alert
        :is-open="showDeleteAlert"
        header="Confirmation"
        :message="t('suivi.deleteCommentConfirm')"
        :buttons="[
          { text: 'Annuler', role: 'cancel', handler: () => { showDeleteAlert = false; } },
          { text: 'Supprimer', role: 'destructive', handler: executeDeleteComment }
        ]"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSpinner, IonIcon, IonModal, IonAlert
} from '@ionic/vue';
import { createOutline, chatbubbleEllipsesOutline, closeOutline, trashOutline } from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();
const router = useRouter();
const loading = ref(true);
const currentStudentId = ref<number | null>(null);

// Behaviour Data
const behaviourData = ref<any>({
  participation: 5,
  rules: 5,
  group_work: 5,
  punctuality: 5,
  care: 5,
  general_appreciation: '',
  teacher_name: '',
  date: '',
  semester: 'S1'
});

const behaviourItems = computed(() => [
  { key: 'participation', label: t('suivi.participation'), icon: '🙋‍♂️', value: behaviourData.value.participation || 5 },
  { key: 'rules', label: t('suivi.rules'), icon: '📜', value: behaviourData.value.rules || 5 },
  { key: 'group_work', label: t('suivi.groupWork'), icon: '🤝', value: behaviourData.value.group_work || 5 },
  { key: 'punctuality', label: t('suivi.punctuality'), icon: '⏰', value: behaviourData.value.punctuality || 5 },
  { key: 'care', label: t('suivi.care'), icon: '🎒', value: behaviourData.value.care || 5 },
]);

const evalCriteria = [
  { key: 'participation', label: 'Participation active', icon: '🙋‍♂️' },
  { key: 'rules', label: 'Discipline & Règles', icon: '📜' },
  { key: 'group_work', label: 'Travail d\'équipe', icon: '🤝' },
  { key: 'punctuality', label: 'Ponctualité & Assiduité', icon: '⏰' },
  { key: 'care', label: 'Soin & Devoirs', icon: '🎒' },
];

// Subjects / Progression Data
const rawGrades = ref<any[]>([]);
const selectedSemester = ref<'S1' | 'S2' | 'all'>('all');

const availableSubjectNames = computed(() => {
  const set = new Set<string>();
  rawGrades.value.forEach(g => {
    if (g.subject) set.add(g.subject);
  });
  return Array.from(set);
});

const filteredSubjects = computed(() => {
  if (rawGrades.value.length === 0) return [];

  // Group grades by subject to compute real average and trend
  const map = new Map<string, any>();

  rawGrades.value.forEach(g => {
    const sem = g.semester || 'S1';
    if (selectedSemester.value !== 'all' && sem !== selectedSemester.value) return;

    const subName = g.subject || 'Matière';
    if (!map.has(subName)) {
      map.set(subName, {
        name: subName,
        marks: [],
        cc1List: [],
        cc2List: [],
        gradeScale: parseFloat(g.grade_scale) || 20
      });
    }
    const item = map.get(subName);
    const finalMark = typeof g.final_mark === 'number' ? g.final_mark : parseFloat(g.final_mark || '0');
    if (!isNaN(finalMark)) item.marks.push(finalMark);
    if (g.cc1) item.cc1List.push(parseFloat(g.cc1));
    if (g.cc2) item.cc2List.push(parseFloat(g.cc2));
  });

  const result: any[] = [];
  map.forEach(item => {
    if (item.marks.length === 0) return;
    const avg = item.marks.reduce((a: number, b: number) => a + b, 0) / item.marks.length;
    
    // Real trend: comparison between CC2 and CC1 or semester marks
    let trend = 0;
    if (item.cc1List.length > 0 && item.cc2List.length > 0) {
      const avgCc1 = item.cc1List.reduce((a: number, b: number) => a + b, 0) / item.cc1List.length;
      const avgCc2 = item.cc2List.reduce((a: number, b: number) => a + b, 0) / item.cc2List.length;
      trend = Math.round((avgCc2 - avgCc1) * 10) / 10;
    }

    result.push({
      name: item.name,
      avg: Math.round(avg * 100) / 100,
      trend: trend,
      gradeScale: item.gradeScale
    });
  });

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
});

// Comments Data
const comments = ref<any[]>([]);

// Modals State
const showEvalModal = ref(false);
const savingEval = ref(false);
const evalForm = reactive({
  semester: 'S1',
  teacher_name: '',
  participation: 5,
  rules: 5,
  group_work: 5,
  punctuality: 5,
  care: 5,
  general_appreciation: ''
});

const showCommentModal = ref(false);
const savingComment = ref(false);
const commentForm = reactive({
  subject: 'Général',
  teacher: '',
  sentiment: 'positive',
  text: ''
});

const showDeleteAlert = ref(false);
const commentToDelete = ref<any>(null);

// Helpers
const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');

const getGradeClass = (v: number, scale = 20) => {
  const ratio = (v || 0) / (scale || 20);
  return ratio >= 0.75 ? 'grade-high' : ratio >= 0.5 ? 'grade-mid' : 'grade-low';
};

const getGradeColor = (v: number, scale = 20) => {
  const ratio = (v || 0) / (scale || 20);
  return ratio >= 0.75 ? 'linear-gradient(90deg, #10b981, #059669)' : ratio >= 0.5 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #f87171, #ef4444)';
};

const getGradeAppraisal = (v: number, scale = 20) => {
  const ratio = (v || 0) / (scale || 20);
  if (locale.value === 'ar') {
    return ratio >= 0.8 ? 'ممتاز' : ratio >= 0.6 ? 'حسن' : ratio >= 0.5 ? 'مستحسن' : 'يحتاج إلى تركيز';
  }
  return ratio >= 0.8 ? 'Très bien' : ratio >= 0.6 ? 'Bien' : ratio >= 0.5 ? 'Satisfaisant' : 'À renforcer';
};

const getSentimentLabel = (sentiment: string) => {
  if (sentiment === 'positive') return `👍 ${t('suivi.positive')}`;
  if (sentiment === 'negative') return `⚠️ ${t('suivi.negative')}`;
  return `ℹ️ ${t('suivi.neutral')}`;
};

const getInitials = (name: string) => {
  if (!name) return '👨‍🏫';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDate = (d: string) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return d;
  }
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

// Modal Handlers
const openEvalModal = () => {
  const savedUser = localStorage.getItem('parent_user');
  let teacherName = 'Enseignant';
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.name) teacherName = u.name;
    } catch (e) {}
  }
  evalForm.teacher_name = behaviourData.value.teacher_name || teacherName;
  evalForm.semester = behaviourData.value.semester || 'S1';
  evalForm.participation = behaviourData.value.participation || 5;
  evalForm.rules = behaviourData.value.rules || 5;
  evalForm.group_work = behaviourData.value.group_work || 5;
  evalForm.punctuality = behaviourData.value.punctuality || 5;
  evalForm.care = behaviourData.value.care || 5;
  evalForm.general_appreciation = behaviourData.value.general_appreciation || '';
  showEvalModal.value = true;
};

const closeEvalModal = () => {
  showEvalModal.value = false;
};

const submitEvalForm = async () => {
  if (!currentStudentId.value) return;
  savingEval.value = true;
  try {
    await apiRequest('/api/school/behaviour/save', {
      student_id: currentStudentId.value,
      semester: evalForm.semester,
      teacher_name: evalForm.teacher_name,
      participation: evalForm.participation,
      rules: evalForm.rules,
      group_work: evalForm.group_work,
      punctuality: evalForm.punctuality,
      care: evalForm.care,
      general_appreciation: evalForm.general_appreciation
    });
    closeEvalModal();
    await fetchBehaviour(currentStudentId.value);
  } catch (e) {
    console.error('Erreur save evaluation:', e);
  } finally {
    savingEval.value = false;
  }
};

const openCommentModal = () => {
  const savedUser = localStorage.getItem('parent_user');
  let teacherName = 'Enseignant';
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.name) teacherName = u.name;
    } catch (e) {}
  }
  commentForm.teacher = teacherName;
  commentForm.subject = availableSubjectNames.value.length > 0 ? availableSubjectNames.value[0] : 'Général';
  commentForm.sentiment = 'positive';
  commentForm.text = '';
  showCommentModal.value = true;
};

const closeCommentModal = () => {
  showCommentModal.value = false;
};

const submitCommentForm = async () => {
  if (!currentStudentId.value || !commentForm.text.trim()) return;
  savingComment.value = true;
  try {
    await apiRequest('/api/school/pedagogical-comments/create', {
      student_id: currentStudentId.value,
      teacher: commentForm.teacher,
      subject: commentForm.subject,
      sentiment: commentForm.sentiment,
      text: commentForm.text
    });
    closeCommentModal();
    await fetchComments(currentStudentId.value);
  } catch (e) {
    console.error('Erreur create comment:', e);
  } finally {
    savingComment.value = false;
  }
};

const confirmDeleteComment = (c: any) => {
  commentToDelete.value = c;
  showDeleteAlert.value = true;
};

const executeDeleteComment = async () => {
  if (!commentToDelete.value) return;
  try {
    await apiRequest('/api/school/pedagogical-comments/delete', { id: commentToDelete.value.id });
    if (currentStudentId.value) {
      await fetchComments(currentStudentId.value);
    }
  } catch (e) {
    console.error('Erreur delete comment:', e);
  } finally {
    showDeleteAlert.value = false;
    commentToDelete.value = null;
  }
};

const fetchBehaviour = async (studentId: number) => {
  try {
    const res = await apiRequest('/api/school/behaviour', { student_id: studentId });
    if (res && typeof res === 'object') {
      behaviourData.value = res;
    }
  } catch (e) {
    console.warn('Erreur chargement behaviour:', e);
  }
};

const fetchComments = async (studentId: number) => {
  try {
    const comms = await apiRequest('/api/school/pedagogical-comments', { student_id: studentId });
    comments.value = Array.isArray(comms) ? comms : [];
  } catch {
    comments.value = [];
  }
};

const fetchData = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) { 
    router.replace('/login'); 
    return; 
  }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    const selectedId = odoo.selectedStudentId;
    const student = students && students.length > 0
      ? (students.find((s: any) => s.id === selectedId) || students[0])
      : null;

    if (student) {
      currentStudentId.value = student.id;

      // 1. Fetch real grades from backend
      try {
        const grades = await apiRequest('/api/school/grades', { student_id: student.id });
        rawGrades.value = Array.isArray(grades) ? grades : [];
      } catch (err) {
        console.warn('Erreur chargement notes pour suivi:', err);
        rawGrades.value = [];
      }

      // 2. Fetch behaviour evaluation
      await fetchBehaviour(student.id);

      // 3. Fetch pedagogical comments
      await fetchComments(student.id);
    }
  } catch (e) {
    console.error('Erreur fetchData suivi pédagogique:', e);
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

.page-hero {
  text-align: center;
  margin: 12px 0 20px 0;
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  margin: 0 auto 10px auto;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.page-hero h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.page-hero p {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
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

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 1.3rem;
}

.section-title-wrap h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.section-subtitle {
  margin: 2px 0 0 0;
  font-size: 0.76rem;
  color: #64748b;
}

/* Admin Action Button */
.admin-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.admin-action-btn.secondary {
  background: #0ea5e9;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);
}

.admin-action-btn:active {
  transform: scale(0.96);
}

/* Cards */
.premium-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Behaviour Card */
.behaviour-card {
  padding: 16px;
}

.behaviour-header-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.eval-by-tag {
  color: #4f46e5;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 6px;
}

.behaviour-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}

.behaviour-row:last-child {
  border-bottom: none;
}

.beh-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.beh-icon {
  font-size: 1.15rem;
}

.beh-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
}

.beh-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.beh-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1.1rem;
  color: #cbd5e1;
}

.star.active {
  color: #f59e0b;
}

.beh-score {
  font-size: 0.82rem;
  font-weight: 800;
  color: #475569;
  min-width: 28px;
  text-align: right;
}

.behaviour-appreciation-box {
  margin-top: 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f8fafc;
  border-left: 3px solid #f59e0b;
  border-radius: 10px;
  padding: 10px 12px;
}

.appreciation-icon {
  font-size: 1.1rem;
}

.appreciation-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.appreciation-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
}

.appreciation-text {
  margin: 0;
  font-size: 0.84rem;
  font-style: italic;
  color: #1e293b;
}

/* Progress Filter Switcher */
.progress-sem-filter {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 10px;
}

.sem-filter-pill {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sem-filter-pill.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Subject Progress Card */
.subject-progress-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.subject-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-name-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-icon {
  font-size: 1.1rem;
}

.sub-name {
  font-size: 0.92rem;
  font-weight: 800;
  color: #1e293b;
}

.sub-grade-badge {
  font-size: 0.85rem;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 8px;
}

.progress-bar-track {
  width: 100%;
  height: 7px;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.sub-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-trend {
  font-size: 0.72rem;
  font-weight: 800;
}

.sub-trend.up {
  color: #059669;
}

.sub-trend.down {
  color: #dc2626;
}

.sub-trend.flat {
  color: #64748b;
}

.sub-status-label {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
}

/* Comments List */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  padding: 14px 16px;
  border-left-width: 4px;
}

.comment-card.border-positive {
  border-left-color: #10b981;
}

.comment-card.border-negative {
  border-left-color: #ef4444;
}

.comment-card.border-neutral {
  border-left-color: #3b82f6;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.teacher-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.comment-meta strong {
  font-size: 0.88rem;
  color: #0f172a;
}

.comment-sub {
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.subject-tag {
  font-weight: 700;
  color: #4f46e5;
}

.sentiment-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.sentiment-positive {
  background: #ecfdf5;
  color: #059669;
}

.sentiment-negative {
  background: #fef2f2;
  color: #dc2626;
}

.sentiment-neutral {
  background: #eff6ff;
  color: #2563eb;
}

.comment-delete-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
}

.comment-delete-btn:hover {
  color: #ef4444;
}

.comment-box {
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
}

.comment-text {
  margin: 0;
  font-size: 0.86rem;
  color: #1e293b;
  line-height: 1.45;
}

/* Empty Card */
.empty-card {
  text-align: center;
  padding: 40px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 8px;
}

.empty-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
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

/* ========================================================
   MODALS STYLES
   ======================================================== */
.modal-wrapper-custom {
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-subtitle {
  margin: 2px 0 0 0;
  font-size: 0.75rem;
  color: #64748b;
}

.modal-close-btn {
  background: #f1f5f9;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #64748b;
  cursor: pointer;
}

.modal-body-custom {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.custom-select, .custom-input, .custom-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.88rem;
  color: #0f172a;
  font-weight: 600;
  outline: none;
  font-family: inherit;
}

.custom-select:focus, .custom-input:focus, .custom-textarea:focus {
  border-color: #4f46e5;
  background: #ffffff;
}

/* Criteria Star Picker */
.criteria-eval-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.criterion-eval-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #edf2f7;
}

.criterion-eval-row:last-child {
  border-bottom: none;
}

.crit-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crit-icon {
  font-size: 1.1rem;
}

.crit-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.crit-star-picker {
  display: flex;
  align-items: center;
  gap: 2px;
}

.picker-star {
  background: transparent;
  border: none;
  font-size: 1.35rem;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0 1px;
}

.picker-star.filled {
  color: #f59e0b;
}

.picker-val-badge {
  font-size: 0.78rem;
  font-weight: 800;
  color: #475569;
  margin-left: 6px;
  min-width: 26px;
}

/* Sentiment Picker Row */
.sentiment-picker-row {
  display: flex;
  gap: 8px;
}

.sent-pick-btn {
  flex: 1;
  padding: 8px 6px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.sent-pick-btn.positive.selected {
  background: #ecfdf5;
  border-color: #10b981;
  color: #059669;
}

.sent-pick-btn.neutral.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}

.sent-pick-btn.negative.selected {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.modal-footer-custom {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.btn-submit {
  flex: 2;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  border: none;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-spinner {
  width: 20px;
  height: 20px;
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
