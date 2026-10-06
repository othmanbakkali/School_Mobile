<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title class="page-title">
          <span class="title-main">{{ t('notes.title') }}</span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="activeMainTab === 'discipline'" fill="clear" color="primary" class="header-action-btn" @click="openBonusModal">
            <ion-icon slot="icon-only" :icon="addCircleOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding custom-content">
      <!-- Student Header Badge (Name, Class, Switcher) -->
      <StudentHeaderBadge />

      <!-- Main Sub-Menu Segment (Academic Notes vs Discipline & Bonus) -->
      <div class="main-subnav-wrapper">
        <ion-segment v-model="activeMainTab" mode="ios" class="main-subnav-segment">
          <ion-segment-button value="academic">
            <ion-label>📊 {{ t('notes.tabAcademic') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="discipline">
            <ion-label>{{ t('notes.tabDiscipline') }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary" />
        <p class="loading-text">{{ activeMainTab === 'academic' ? 'Chargement des notes et sous-matières...' : 'Chargement des points bonus & discipline...' }}</p>
      </div>

      <div v-else class="fade-in">
        <!-- ========================================== -->
        <!-- TAB 1: ACADEMIC NOTES & BULLETINS          -->
        <!-- ========================================== -->
        <div v-if="activeMainTab === 'academic'">
          <!-- Semester Selection Filter -->
          <div class="semester-filter-wrapper">
            <ion-segment v-model="selectedSemester" mode="ios" class="custom-segment">
              <ion-segment-button value="S1">
                <ion-label>{{ t('notes.semester1') }}</ion-label>
              </ion-segment-button>
              <ion-segment-button value="S2">
                <ion-label>{{ t('notes.semester2') }}</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>

          <!-- Global Semester Average Card -->
          <div v-if="filteredNotes.length > 0" class="premium-card overview-card">
            <div class="overview-decoration"></div>
            <div class="overview-header">
              <div class="overview-info">
                <span class="overview-subtitle">Synthèse {{ selectedSemester === 'S1' ? t('notes.semester1') : t('notes.semester2') }}</span>
                <h2 class="overview-title">{{ t('notes.generalAverage') }}</h2>
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
                  <span class="meta-label">{{ t('notes.subjectCount') }}</span>
                  <span class="meta-val">{{ filteredNotes.length }}</span>
                </div>
                <div class="meta-divider"></div>
                <div class="meta-item">
                  <span class="meta-label">{{ t('notes.subSubjectCount') }}</span>
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

          <!-- Empty State Academic -->
          <div v-if="filteredNotes.length === 0" class="empty-state-card">
            <div class="empty-icon">📝</div>
            <h3>Aucune note disponible</h3>
            <p>Aucune évaluation n'a été enregistrée pour ce semestre.</p>
          </div>

          <!-- Subjects List with Sub-sections Accordion -->
          <div class="subjects-container" v-else>
            <div class="section-title-box">
              <h3 class="section-title">Table des Matières & Sous-matières</h3>
              <span class="section-counter">{{ filteredNotes.length }} {{ t('notes.subjectCount').toLowerCase() }}</span>
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

        <!-- ========================================== -->
        <!-- TAB 2: DISCIPLINE & POINTS BONUS           -->
        <!-- ========================================== -->
        <div v-else-if="activeMainTab === 'discipline'" class="discipline-section">
          <!-- Discipline Semester Filter -->
          <div class="semester-filter-wrapper">
            <ion-segment v-model="disciplineSemester" mode="ios" class="custom-segment discipline-seg">
              <ion-segment-button value="all">
                <ion-label>Tous</ion-label>
              </ion-segment-button>
              <ion-segment-button value="S1">
                <ion-label>{{ t('notes.semester1') }}</ion-label>
              </ion-segment-button>
              <ion-segment-button value="S2">
                <ion-label>{{ t('notes.semester2') }}</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>

          <!-- KPI Summary Card for Discipline & Bonus -->
          <div class="premium-card discipline-kpi-card">
            <div class="discipline-decoration"></div>
            
            <div class="kpi-top-row">
              <div class="kpi-lead">
                <span class="kpi-subtitle">Tableau d'Honneur & Mérite</span>
                <h2 class="kpi-title">Discipline & Assiduité</h2>
              </div>
              <div class="kpi-crown-badge">
                <span class="crown-icon">🏆</span>
                <span class="crown-text">Exemplaire</span>
              </div>
            </div>

            <div class="kpi-stats-grid">
              <div class="kpi-stat-box highlight">
                <span class="kpi-stat-num">+{{ totalBonusPoints.toFixed(1) }}</span>
                <span class="kpi-stat-label">{{ t('notes.totalBonusPoints') }}</span>
              </div>
              <div class="kpi-stat-divider"></div>
              <div class="kpi-stat-box">
                <span class="kpi-stat-num">{{ filteredBonuses.length }}</span>
                <span class="kpi-stat-label">{{ t('notes.meritsCount') }}</span>
              </div>
              <div class="kpi-stat-divider"></div>
              <div class="kpi-stat-box">
                <span class="kpi-stat-num">{{ disciplineStatusScore }}</span>
                <span class="kpi-stat-label">{{ t('notes.disciplineIndex') }}</span>
              </div>
            </div>

            <div class="kpi-footer-note">
              <span>🌟 Les points bonus récompensent la participation active, le sérieux et l'esprit d'entraide.</span>
            </div>
          </div>

          <!-- Action & Filter Bar -->
          <div class="discipline-actions-bar">
            <!-- Add Bonus Button -->
            <button class="award-bonus-btn" @click="openBonusModal">
              <ion-icon :icon="sparklesOutline" class="btn-icon" />
              <span>{{ t('notes.awardBonusBtn') }}</span>
            </button>
          </div>

          <!-- Category Quick Filter Chips -->
          <div class="category-chips-scroll">
            <button 
              v-for="cat in categoryFilters" 
              :key="cat.key" 
              class="cat-chip" 
              :class="{ 'active': selectedCategoryFilter === cat.key }"
              @click="selectedCategoryFilter = cat.key"
            >
              <span class="chip-emoji">{{ cat.emoji }}</span>
              <span class="chip-label">{{ cat.label }}</span>
              <span v-if="cat.count > 0" class="chip-count">{{ cat.count }}</span>
            </button>
          </div>

          <!-- Empty State Discipline -->
          <div v-if="filteredBonuses.length === 0" class="empty-state-card discipline-empty">
            <div class="empty-icon">🌟</div>
            <h3>{{ t('notes.emptyBonuses') }}</h3>
            <p>{{ t('notes.emptyBonusesDesc') }}</p>
            <button class="empty-action-btn" @click="openBonusModal">
              <ion-icon :icon="addCircleOutline" />
              <span>{{ t('notes.awardBonusBtn') }}</span>
            </button>
          </div>

          <!-- Timeline / Merit Cards Feed -->
          <div v-else class="bonuses-feed">
            <div class="feed-header-line">
              <h3 class="feed-title">Historique des Mérites & Points Bonus</h3>
              <span class="feed-count">{{ filteredBonuses.length }} enregistrements</span>
            </div>

            <div 
              v-for="item in filteredBonuses" 
              :key="item.id" 
              class="premium-card bonus-card"
            >
              <div class="bonus-card-top">
                <div class="bonus-cat-badge" :style="{ background: getBonusCategoryConfig(item.category).bg, color: getBonusCategoryConfig(item.category).color }">
                  <span class="cat-icon">{{ getBonusCategoryConfig(item.category).icon }}</span>
                  <span class="cat-name">{{ getBonusCategoryConfig(item.category).label }}</span>
                </div>
                
                <div class="bonus-points-tag">
                  <span class="plus-sign">+</span>
                  <span class="points-val">{{ parseFloat(item.points).toFixed(1) }}</span>
                  <span class="points-unit">pts</span>
                </div>

                <button class="bonus-delete-btn" @click.stop="confirmDeleteBonus(item)" title="Supprimer ce bonus">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>

              <div class="bonus-card-meta">
                <div class="meta-tag subject-tag">
                  <span class="tag-icon">📚</span>
                  <span class="tag-text">{{ item.subject || 'Général / Vie scolaire' }}</span>
                </div>
                <div class="meta-tag semester-tag">
                  <span class="tag-icon">🗓️</span>
                  <span class="tag-text">{{ item.semester === 'S2' ? t('notes.semester2') : t('notes.semester1') }}</span>
                </div>
                <div class="meta-tag date-tag">
                  <span class="tag-icon">📅</span>
                  <span class="tag-text">{{ formatDate(item.date) }}</span>
                </div>
              </div>

              <!-- Teacher Observation Bubble -->
              <div class="teacher-bubble" v-if="item.comment">
                <div class="bubble-quote-icon">💬</div>
                <div class="bubble-content">
                  <p class="bubble-text">« {{ item.comment }} »</p>
                  <span class="bubble-author">— {{ item.teacher || 'Professeur' }}</span>
                </div>
              </div>
              <div class="teacher-bubble fallback" v-else>
                <div class="bubble-quote-icon">⭐</div>
                <div class="bubble-content">
                  <p class="bubble-text">Attribution de point bonus pour {{ getBonusCategoryConfig(item.category).label.toLowerCase() }}.</p>
                  <span class="bubble-author">— {{ item.teacher || 'Professeur' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: ATTRIBUER UN POINT BONUS            -->
      <!-- ========================================== -->
      <ion-modal :is-open="showBonusModal" @didDismiss="closeBonusModal" class="bonus-form-modal">
        <div class="modal-wrapper-custom">
          <!-- Modal Header -->
          <div class="modal-header-custom">
            <div class="modal-header-info">
              <div class="modal-icon-badge">✨</div>
              <div>
                <h2 class="modal-title">{{ t('notes.awardBonusTitle') }}</h2>
                <p class="modal-subtitle">{{ t('notes.awardBonusDesc') }}</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="closeBonusModal">
              <ion-icon :icon="closeOutline" />
            </button>
          </div>

          <!-- Modal Body Form -->
          <div class="modal-body-custom">
            <!-- 1. Category Selection -->
            <div class="form-group">
              <label class="form-label">{{ t('notes.selectCategory') }}</label>
              <div class="category-picker-grid">
                <button 
                  type="button" 
                  v-for="c in categoriesList" 
                  :key="c.id"
                  class="cat-picker-btn"
                  :class="{ 'selected': bonusForm.category === c.id }"
                  @click="bonusForm.category = c.id"
                >
                  <span class="picker-emoji">{{ c.icon }}</span>
                  <span class="picker-text">{{ c.label }}</span>
                </button>
              </div>
            </div>

            <!-- 2. Points Amount Picker -->
            <div class="form-group">
              <label class="form-label">{{ t('notes.bonusValue') }}</label>
              <div class="points-picker-row">
                <button 
                  type="button"
                  v-for="p in [0.5, 1.0, 1.5, 2.0, 3.0]" 
                  :key="p"
                  class="points-quick-pill"
                  :class="{ 'selected': bonusForm.points === p }"
                  @click="bonusForm.points = p"
                >
                  +{{ p.toFixed(1) }} pt{{ p > 1 ? 's' : '' }}
                </button>
              </div>
            </div>

            <!-- 3. Semester & Subject -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Semestre</label>
                <select v-model="bonusForm.semester" class="custom-select">
                  <option value="S1">{{ t('notes.semester1') }}</option>
                  <option value="S2">{{ t('notes.semester2') }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('notes.associatedSubject') }}</label>
                <select v-model="bonusForm.subject_name" class="custom-select">
                  <option value="">{{ t('notes.generalSubject') }}</option>
                  <option v-for="s in uniqueSubjectNames" :key="s" :value="s">
                    {{ s }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 4. Teacher Name / Sign -->
            <div class="form-group">
              <label class="form-label">Nom de l'Enseignant</label>
              <input 
                v-model="bonusForm.teacher_name" 
                type="text" 
                class="custom-input" 
                placeholder="Ex: Professeur / Direction"
              />
            </div>

            <!-- 5. Teacher Observation / Comment -->
            <div class="form-group">
              <label class="form-label">{{ t('notes.teacherComment') }}</label>
              <textarea 
                v-model="bonusForm.comment" 
                rows="3" 
                class="custom-textarea" 
                :placeholder="t('notes.teacherCommentPlaceholder')"
              ></textarea>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="modal-footer-custom">
            <button class="btn-cancel" @click="closeBonusModal">Annuler</button>
            <button class="btn-submit" :disabled="savingBonus" @click="submitBonusForm">
              <ion-spinner v-if="savingBonus" name="crescent" class="btn-spinner" />
              <span v-else>{{ t('notes.confirmBonus') }}</span>
            </button>
          </div>
        </div>
      </ion-modal>

      <!-- Delete Confirmation Toast / Alert Modal -->
      <ion-alert
        :is-open="showDeleteAlert"
        header="Confirmation"
        :message="t('notes.deleteBonusConfirm')"
        :buttons="[
          { text: 'Annuler', role: 'cancel', handler: () => { showDeleteAlert = false; } },
          { text: 'Supprimer', role: 'destructive', handler: executeDeleteBonus }
        ]"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonButtons, 
  IonMenuButton, IonIcon, IonModal, IonAlert, IonButton
} from '@ionic/vue';
import { 
  chevronDownOutline, chevronUpOutline, sparklesOutline, 
  addCircleOutline, trashOutline, closeOutline 
} from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();
const router = useRouter();

// Main Sub-menu Switcher
const activeMainTab = ref<'academic' | 'discipline'>('academic');

// Academic State
const notes = ref<any[]>([]);
const loading = ref(true);
const selectedSemester = ref('S1');
const expandedSubjects = ref<Set<string | number>>(new Set());
const gradeScale = ref('20');

// Discipline & Bonus State
const bonuses = ref<any[]>([]);
const disciplineSemester = ref('all');
const selectedCategoryFilter = ref('all');
const showBonusModal = ref(false);
const savingBonus = ref(false);
const showDeleteAlert = ref(false);
const bonusToDelete = ref<any>(null);

const currentStudentId = ref<number | null>(null);

const bonusForm = reactive({
  category: 'participation',
  points: 1.0,
  semester: 'S1',
  subject_name: '',
  teacher_name: '',
  comment: '',
});

const categoriesList = [
  { id: 'participation', icon: '🙋‍♂️', label: 'Participation active' },
  { id: 'assiduite', icon: '⏰', label: 'Assiduité & Ponctualité' },
  { id: 'discipline', icon: '📜', label: 'Discipline & Respect' },
  { id: 'travail', icon: '📚', label: 'Soin du travail & Devoirs' },
  { id: 'entraide', icon: '🤝', label: 'Entraide & Camaraderie' },
  { id: 'autre', icon: '⭐', label: 'Autre distinction' },
];

const categoryFilters = computed(() => {
  const list = [
    { key: 'all', emoji: '✨', label: 'Tous', count: bonuses.value.length },
    { key: 'participation', emoji: '🙋‍♂️', label: 'Participation', count: bonuses.value.filter(b => b.category === 'participation').length },
    { key: 'assiduite', emoji: '⏰', label: 'Assiduité', count: bonuses.value.filter(b => b.category === 'assiduite').length },
    { key: 'discipline', emoji: '📜', label: 'Discipline', count: bonuses.value.filter(b => b.category === 'discipline').length },
    { key: 'travail', emoji: '📚', label: 'Devoirs & Soin', count: bonuses.value.filter(b => b.category === 'travail').length },
    { key: 'entraide', emoji: '🤝', label: 'Entraide', count: bonuses.value.filter(b => b.category === 'entraide').length },
  ];
  return list;
});

// Academic Computed
const filteredNotes = computed(() => {
  return notes.value.filter(n => n.semester === selectedSemester.value);
});

const uniqueSubjectNames = computed(() => {
  const set = new Set<string>();
  notes.value.forEach(n => {
    if (n.subject) set.add(n.subject);
  });
  return Array.from(set);
});

const totalSubSectionsCount = computed(() => {
  return filteredNotes.value.reduce((acc, n) => acc + (n.sub_sections_count || (n.sub_sections ? n.sub_sections.length : 0)), 0);
});

const semesterAverage = computed(() => {
  if (filteredNotes.value.length === 0) return 0;
  const sum = filteredNotes.value.reduce((acc, n) => acc + (parseFloat(n.final_mark) || 0), 0);
  return Math.round((sum / filteredNotes.value.length) * 100) / 100;
});

// Discipline Computed
const filteredBonuses = computed(() => {
  return bonuses.value.filter(b => {
    const matchSem = disciplineSemester.value === 'all' || b.semester === disciplineSemester.value;
    const matchCat = selectedCategoryFilter.value === 'all' || b.category === selectedCategoryFilter.value;
    return matchSem && matchCat;
  });
});

const totalBonusPoints = computed(() => {
  const list = disciplineSemester.value === 'all' 
    ? bonuses.value 
    : bonuses.value.filter(b => b.semester === disciplineSemester.value);
  return list.reduce((acc, b) => acc + (parseFloat(b.points) || 0), 0);
});

const disciplineStatusScore = computed(() => {
  const pts = totalBonusPoints.value;
  if (pts >= 4.0) return '⭐ Excellent';
  if (pts >= 2.0) return '👍 Très Bon';
  if (pts >= 1.0) return '✨ Favorable';
  return '✔️ Régulier';
});

// Category Config helper
const getBonusCategoryConfig = (cat: string) => {
  switch (cat) {
    case 'participation':
      return { icon: '🙋‍♂️', label: 'Participation', bg: '#eff6ff', color: '#2563eb' };
    case 'assiduite':
      return { icon: '⏰', label: 'Assiduité', bg: '#ecfdf5', color: '#059669' };
    case 'discipline':
      return { icon: '📜', label: 'Discipline', bg: '#faf5ff', color: '#9333ea' };
    case 'travail':
      return { icon: '📚', label: 'Soin & Devoirs', bg: '#fffbeb', color: '#d97706' };
    case 'entraide':
      return { icon: '🤝', label: 'Entraide', bg: '#ecfeff', color: '#0891b2' };
    default:
      return { icon: '⭐', label: 'Distinction', bg: '#fdf2f8', color: '#db2777' };
  }
};

const formatDate = (dateStr: any) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

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

// Modal handlers
const openBonusModal = () => {
  const savedUser = localStorage.getItem('parent_user');
  let teacherName = 'Enseignant';
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.name) teacherName = u.name;
    } catch (e) {}
  }
  bonusForm.teacher_name = teacherName;
  bonusForm.category = 'participation';
  bonusForm.points = 1.0;
  bonusForm.semester = selectedSemester.value || 'S1';
  bonusForm.comment = '';
  bonusForm.subject_name = uniqueSubjectNames.value.length > 0 ? uniqueSubjectNames.value[0] : '';
  showBonusModal.value = true;
};

const closeBonusModal = () => {
  showBonusModal.value = false;
};

const submitBonusForm = async () => {
  if (!currentStudentId.value) return;
  savingBonus.value = true;
  try {
    await apiRequest('/api/school/discipline-bonuses/create', {
      student_id: currentStudentId.value,
      category: bonusForm.category,
      points: bonusForm.points,
      semester: bonusForm.semester,
      subject_name: bonusForm.subject_name,
      teacher_name: bonusForm.teacher_name,
      comment: bonusForm.comment
    });
    closeBonusModal();
    // Refresh bonuses
    await fetchBonuses(currentStudentId.value);
  } catch (e) {
    console.error('Erreur ajout bonus:', e);
  } finally {
    savingBonus.value = false;
  }
};

const confirmDeleteBonus = (item: any) => {
  bonusToDelete.value = item;
  showDeleteAlert.value = true;
};

const executeDeleteBonus = async () => {
  if (!bonusToDelete.value) return;
  try {
    await apiRequest('/api/school/discipline-bonuses/delete', { id: bonusToDelete.value.id });
    if (currentStudentId.value) {
      await fetchBonuses(currentStudentId.value);
    }
  } catch (e) {
    console.error('Erreur suppression bonus:', e);
  } finally {
    showDeleteAlert.value = false;
    bonusToDelete.value = null;
  }
};

const fetchBonuses = async (studentId: number) => {
  try {
    const res = await apiRequest('/api/school/discipline-bonuses', { student_id: studentId });
    bonuses.value = Array.isArray(res) ? res : [];
  } catch (e) {
    console.warn('Erreur chargement bonuses:', e);
    bonuses.value = [];
  }
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
      currentStudentId.value = student.id;

      // 1. Fetch Academic Grades
      const bodyWithId = { student_id: student.id };
      const res = await apiRequest('/api/school/grades', bodyWithId);
      notes.value = Array.isArray(res) ? res : [];
      if (notes.value.length > 0 && notes.value[0].grade_scale) {
        gradeScale.value = notes.value[0].grade_scale;
      }
      if (filteredNotes.value.length > 0) {
        const first = filteredNotes.value[0];
        expandedSubjects.value.add(first.subject_id || first.subject);
      }

      // 2. Fetch Discipline Bonuses
      await fetchBonuses(student.id);
    }
  } catch (e: any) {
    console.error('Erreur chargement notes & discipline:', e);
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

.header-action-btn {
  font-size: 1.4rem;
  --color: #4f46e5;
}

/* Subnav Segment */
.main-subnav-wrapper {
  margin-bottom: 16px;
}

.main-subnav-segment {
  background: #e2e8f0;
  border-radius: 14px;
  padding: 4px;
}

.main-subnav-segment ion-segment-button {
  --indicator-color: #ffffff;
  --indicator-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --color: #64748b;
  --color-checked: #0f172a;
  font-weight: 700;
  font-size: 0.88rem;
  min-height: 40px;
  border-radius: 10px;
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
  max-width: 340px;
  --background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
}

.discipline-seg {
  max-width: 360px;
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

/* ========================================================
   DISCIPLINE & KPI CARDS
   ======================================================== */
.discipline-kpi-card {
  position: relative;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  border-radius: 20px;
  padding: 22px;
  color: #ffffff;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 12px 28px -6px rgba(67, 56, 202, 0.35);
}

.discipline-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0) 70%);
  border-radius: 50%;
}

.kpi-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.kpi-subtitle {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #a5b4fc;
  font-weight: 700;
}

.kpi-title {
  margin: 4px 0 0 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
}

.kpi-crown-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.crown-icon {
  font-size: 1rem;
}

.crown-text {
  font-size: 0.78rem;
  font-weight: 800;
  color: #fde047;
}

.kpi-stats-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.kpi-stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.kpi-stat-num {
  font-size: 1.6rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
}

.kpi-stat-box.highlight .kpi-stat-num {
  color: #fde047;
}

.kpi-stat-label {
  font-size: 0.68rem;
  color: #c7d2fe;
  font-weight: 700;
  margin-top: 4px;
}

.kpi-stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
}

.kpi-footer-note {
  font-size: 0.76rem;
  color: #e0e7ff;
  line-height: 1.4;
  opacity: 0.9;
}

/* Action Bar */
.discipline-actions-bar {
  margin-bottom: 14px;
}

.award-bonus-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  border: none;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 800;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.award-bonus-btn:active {
  transform: scale(0.98);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Category Filter Chips */
.category-chips-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.category-chips-scroll::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 20px;
  white-space: nowrap;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cat-chip.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
}

.chip-count {
  background: #e2e8f0;
  color: #334155;
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 10px;
}

.cat-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Timeline & Merit Cards Feed */
.feed-header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 0 4px;
}

.feed-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.feed-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.bonuses-feed {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bonus-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.bonus-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bonus-cat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 800;
}

.bonus-points-tag {
  display: flex;
  align-items: baseline;
  gap: 2px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 900;
  margin-left: auto;
  margin-right: 8px;
}

.plus-sign {
  font-size: 0.85rem;
}

.points-val {
  font-size: 1.15rem;
}

.points-unit {
  font-size: 0.72rem;
  font-weight: 700;
}

.bonus-delete-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.15rem;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
}

.bonus-delete-btn:hover {
  color: #ef4444;
}

.bonus-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}

/* Teacher Observation Bubble */
.teacher-bubble {
  display: flex;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-left: 3px solid #6366f1;
  border-radius: 10px;
  padding: 10px 12px;
}

.bubble-quote-icon {
  font-size: 1.1rem;
  color: #6366f1;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.bubble-text {
  margin: 0;
  font-size: 0.85rem;
  font-style: italic;
  color: #1e293b;
  line-height: 1.4;
}

.bubble-author {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

/* Empty State */
.empty-state-card {
  text-align: center;
  padding: 50px 20px;
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

.empty-action-btn {
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
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
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.subject-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 14px;
  overflow: hidden;
  transition: all 0.25s ease;
}

.subject-card.is-expanded {
  border-color: #cbd5e1;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
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
}

.subject-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.subject-name {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e293b;
}

.sub-count-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 6px;
}

.subject-score-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.parent-average-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.avg-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #94a3b8;
}

.parent-score-box {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 3px 10px;
  border-radius: 8px;
  font-weight: 900;
}

.score-val {
  font-size: 1.1rem;
}

.score-scale {
  font-size: 0.75rem;
  opacity: 0.75;
}

.expand-btn {
  font-size: 1.2rem;
  color: #94a3b8;
}

.marks-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #f1f5f9;
  border-top: 1px solid #f1f5f9;
}

.quick-mark-item {
  background: #ffffff;
  padding: 8px 4px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
}

.quick-val {
  font-size: 0.85rem;
  font-weight: 800;
  color: #334155;
}

/* Accordion Drawer */
.sub-sections-drawer {
  background: #fafafa;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
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

/* ========================================================
   MODAL STYLES
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
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-subtitle {
  margin: 2px 0 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.modal-close-btn {
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
}

.modal-body-custom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.category-picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.cat-picker-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cat-picker-btn.selected {
  background: #eef2ff;
  border-color: #4f46e5;
  color: #4f46e5;
}

.points-picker-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.points-quick-pill {
  flex: 1;
  min-width: 55px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #334155;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.points-quick-pill.selected {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
}

.custom-select, .custom-input, .custom-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 600;
  outline: none;
  font-family: inherit;
}

.custom-select:focus, .custom-input:focus, .custom-textarea:focus {
  border-color: #4f46e5;
  background: #ffffff;
}

.modal-footer-custom {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 14px;
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
  font-size: 0.9rem;
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
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-spinner {
  width: 20px;
  height: 20px;
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
