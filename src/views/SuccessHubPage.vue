<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Espace Réussite & Jeux</ion-title>
      </ion-toolbar>
      <div class="segment-container">
        <ion-segment v-model="activeSegment" mode="md" class="custom-segment">
          <ion-segment-button value="badges">
            <ion-label>🏆 Rangs & Badges</ion-label>
          </ion-segment-button>
          <ion-segment-button value="revision">
            <ion-label>📚 Révisions Matières</ion-label>
          </ion-segment-button>
          <ion-segment-button value="quests">
            <ion-label>⚡ Défis Journaliers</ion-label>
          </ion-segment-button>
          <ion-segment-button value="analytics">
            <ion-label>📈 Progression</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge with real-time sync -->
        <StudentHeaderBadge />

        <!-- ==================== TAB 1: RANGS & BADGES ==================== -->
        <div v-if="activeSegment === 'badges'" class="badges-view">
          <div class="header-banner premium-card ion-padding">
            <div class="banner-flex">
              <div class="avatar-trophy">{{ ludicStats.level_badge || '🏆' }}</div>
              <div class="banner-info">
                <span class="rank-tag">{{ ludicStats.level_title || 'Apprenti Novice' }}</span>
                <h2>{{ totalXp }} <span class="xp-unit">XP Ludiques</span></h2>
                <p>Prochain rang : <strong>{{ ludicStats.next_level_xp }} XP</strong></p>
                <div class="level-progress-bar">
                  <div class="level-progress-fill" :style="{ width: (ludicStats.progress_pct || 50) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-title-row">
            <h3>Badges & Accomplissements</h3>
            <span class="unlocked-count">{{ unlockedBadgesCount }} / {{ badgesList.length }} Débloqués</span>
          </div>

          <div class="badges-grid">
            <div v-for="badge in badgesList" 
                 :key="badge.id" 
                 class="badge-card premium-card text-center" 
                 :class="{ locked: !badge.unlocked }"
                 @click="openBadgeDetails(badge)">
              <div class="badge-icon-wrap" :style="{ background: badge.color }">
                <span class="badge-emoji">{{ badge.emoji }}</span>
                <div v-if="!badge.unlocked" class="lock-overlay">🔒</div>
                <div v-else class="shine-glow"></div>
              </div>
              <h3>{{ badge.title }}</h3>
              <span class="badge-xp" :style="{ color: badge.unlocked ? badge.color : '#94a3b8' }">
                {{ badge.unlocked ? '+' + badge.xp + ' XP' : 'Verrouillé' }}
              </span>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: RÉVISIONS PAR MATIÈRE ==================== -->
        <div v-else-if="activeSegment === 'revision'" class="revision-view">
          
          <!-- State A: List of Revisions by Subject -->
          <div v-if="quizMode === 'list'">
            <div class="revision-hero premium-card ion-padding text-center">
              <span class="hero-icon">📚✨</span>
              <h2>Révisions Interactives</h2>
              <p>Réviser les cours préparés par vos professeurs, répondez aux questions et gagnez des points XP !</p>
            </div>

            <!-- Subject Filter Pills -->
            <div class="subjects-filter-scroll" v-if="availableSubjects.length > 0">
              <button class="filter-pill" 
                      :class="{ active: selectedSubjectId === null }"
                      @click="selectedSubjectId = null">
                Toutes les matières
              </button>
              <button v-for="sub in availableSubjects" 
                      :key="sub.id" 
                      class="filter-pill"
                      :class="{ active: selectedSubjectId === sub.id }"
                      @click="selectedSubjectId = sub.id">
                {{ sub.name }} ({{ sub.count }})
              </button>
            </div>

            <!-- Revisions Loading State -->
            <div v-if="loadingRevisions" class="loading-state ion-padding text-center">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p>Chargement des révisions...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredRevisions.length === 0" class="empty-state premium-card ion-padding text-center">
              <span class="empty-emoji">📖</span>
              <h3>Aucune révision publiée pour le moment</h3>
              <p>Vos professeurs ajouteront bientôt de nouveaux quiz et fiches de révision dans cette matière.</p>
            </div>

            <!-- Revisions Card List -->
            <div v-else class="revisions-cards-grid">
              <div v-for="rev in filteredRevisions" 
                   :key="rev.id" 
                   class="revision-card premium-card ion-padding">
                <div class="card-header-flex">
                  <span class="subject-tag">{{ rev.subject_id ? rev.subject_id[1] : 'Matière' }}</span>
                  <span class="difficulty-tag" :class="rev.difficulty || 'medium'">
                    {{ getDifficultyLabel(rev.difficulty) }}
                  </span>
                </div>

                <h3 class="revision-title">{{ rev.name }}</h3>
                <p class="revision-desc" v-if="rev.description">{{ rev.description }}</p>

                <div class="revision-meta-row">
                  <span class="meta-item">❓ {{ rev.questions_count || (rev.questions && rev.questions.length) || 0 }} questions</span>
                  <span class="meta-item xp-gain">⚡ +{{ rev.xp_reward || 30 }} XP</span>
                  <span class="meta-item teacher" v-if="rev.teacher_id">👨‍🏫 {{ rev.teacher_id[1] }}</span>
                </div>

                <div class="card-footer-flex">
                  <div v-if="rev.is_completed" class="completed-badge">
                    <span class="check-icon">✓</span>
                    <span>Note : <strong>{{ rev.best_score }}/20</strong></span>
                  </div>
                  <div v-else class="not-completed-badge">
                    <span>Non complété</span>
                  </div>

                  <button class="play-btn" @click="startQuiz(rev)">
                    {{ rev.is_completed ? 'Rejouer 🔄' : 'Commencer 🚀' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- State B: Interactive Quiz Mode -->
          <div v-else-if="quizMode === 'playing'" class="quiz-play-view">
            <div class="quiz-top-bar">
              <button class="quiz-back-btn" @click="confirmQuitQuiz">✕ Quitter</button>
              <div class="quiz-progress-text">
                Question <strong>{{ currentQuestionIndex + 1 }}</strong> / {{ currentQuizQuestions.length }}
              </div>
              <span class="quiz-xp-badge">+{{ activeQuiz.xp_reward || 30 }} XP</span>
            </div>

            <div class="quiz-progress-track">
              <div class="quiz-progress-bar" 
                   :style="{ width: ((currentQuestionIndex + 1) / currentQuizQuestions.length * 100) + '%' }"></div>
            </div>

            <!-- Active Question Card -->
            <div class="quiz-question-card premium-card ion-padding" v-if="currentQuestion">
              <div class="question-header">
                <span class="q-seq">Q{{ currentQuestionIndex + 1 }}</span>
                <span class="q-subject">{{ activeQuiz.subject_id ? activeQuiz.subject_id[1] : activeQuiz.name }}</span>
              </div>

              <h2 class="question-text">{{ currentQuestion.question }}</h2>

              <!-- Options Grid (A, B, C, D) -->
              <div class="quiz-options-list">
                <button v-for="opt in getQuestionOptions(currentQuestion)" 
                        :key="opt.key"
                        class="quiz-option-btn"
                        :class="{ selected: selectedAnswers[currentQuestion.id] === opt.key }"
                        @click="selectOption(currentQuestion.id, opt.key)">
                  <span class="option-letter">{{ opt.key }}</span>
                  <span class="option-label">{{ opt.text }}</span>
                </button>
              </div>
            </div>

            <!-- Quiz Navigation -->
            <div class="quiz-controls-row">
              <button class="quiz-nav-btn prev" 
                      :disabled="currentQuestionIndex === 0" 
                      @click="currentQuestionIndex--">
                ← Précédente
              </button>

              <button v-if="currentQuestionIndex < currentQuizQuestions.length - 1" 
                      class="quiz-nav-btn next" 
                      @click="currentQuestionIndex++">
                Suivante →
              </button>

              <button v-else 
                      class="quiz-nav-btn finish" 
                      :disabled="submittingQuiz"
                      @click="submitQuizAnswers">
                <span v-if="submittingQuiz">Évaluation... ⏳</span>
                <span v-else>Terminer & Valider 🎯</span>
              </button>
            </div>
          </div>

          <!-- State C: Quiz Result & Evaluation Screen -->
          <div v-else-if="quizMode === 'result'" class="quiz-result-view">
            <div class="result-hero-card premium-card ion-padding text-center">
              <div class="result-trophy-anim">
                {{ quizResult.score >= 15 ? '🎉 🏆 🌟' : (quizResult.score >= 10 ? '👏 👍' : '💪 📖') }}
              </div>
              <h2>{{ quizResult.score >= 15 ? 'Excellent Travail !' : (quizResult.score >= 10 ? 'Bon Résultat !' : 'Continue tes efforts !') }}</h2>
              <div class="result-score-banner">
                <span class="big-score">{{ quizResult.score }} <span class="max-score">/ 20</span></span>
              </div>
              <p class="score-summary">
                {{ quizResult.correct_count }} sur {{ quizResult.total_questions }} bonnes réponses
              </p>

              <div class="xp-earned-chip">
                ⚡ +{{ quizResult.xp_earned }} XP Gagnés !
              </div>
            </div>

            <!-- Detailed Correction -->
            <div class="section-title-row" style="margin-top: 20px;">
              <h3>Correction Détaillée & Explications</h3>
            </div>

            <div class="corrections-list">
              <div v-for="(corr, idx) in quizResult.corrections" 
                   :key="corr.question_id"
                   class="correction-card premium-card ion-padding"
                   :class="{ correct: corr.is_correct, incorrect: !corr.is_correct }">
                <div class="corr-header">
                  <span class="corr-badge" :class="{ correct: corr.is_correct }">
                    {{ corr.is_correct ? '✓ Correct' : '✗ Erreur' }}
                  </span>
                  <span class="corr-num">Question {{ idx + 1 }}</span>
                </div>

                <h4 class="corr-question">{{ corr.question }}</h4>

                <div class="corr-answers-box">
                  <p class="user-ans" :class="{ correct: corr.is_correct }">
                    <strong>Votre réponse :</strong> Option {{ corr.user_answer }}
                  </p>
                  <p class="correct-ans" v-if="!corr.is_correct">
                    <strong>Bonne réponse :</strong> Option {{ corr.correct_option }}
                  </p>
                </div>

                <div class="explanation-box" v-if="corr.explanation">
                  💡 <strong>Explication du professeur :</strong> {{ corr.explanation }}
                </div>
              </div>
            </div>

            <button class="modal-action-btn back-list-btn" @click="backToRevisionList">
              Retour aux révisions
            </button>
          </div>

        </div>

        <!-- ==================== TAB 3: DÉFIS JOURNALIERS ==================== -->
        <div v-else-if="activeSegment === 'quests'" class="quests-view">
          <div class="quests-status premium-card ion-padding text-center">
            <span class="quest-top-emoji">⚡🎯⚡</span>
            <h3>Défis du Jour</h3>
            <p>Relevez les défis quotidiens préparés par vos enseignants pour booster vos points ludiques !</p>
            <div class="quests-progress-flex" v-if="dailyChallenges.length > 0">
              <span>{{ completedChallengesCount }} / {{ dailyChallenges.length }} Complétés aujourd'hui</span>
              <div class="quests-bar">
                <div class="quests-fill" 
                     :style="{ width: (completedChallengesCount / dailyChallenges.length * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <div v-if="loadingChallenges" class="loading-state ion-padding text-center">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Chargement des défis...</p>
          </div>

          <div v-else-if="dailyChallenges.length === 0" class="empty-state premium-card ion-padding text-center">
            <span class="empty-emoji">🌟</span>
            <h3>Tous les défis du jour sont relevés !</h3>
            <p>Revenez demain pour de nouveaux défis passionnants ou explorez l'onglet Révisions.</p>
          </div>

          <div v-else class="quests-list">
            <div v-for="ch in dailyChallenges" 
                 :key="ch.id" 
                 class="quest-item premium-card ion-padding" 
                 :class="{ completed: ch.completed }">
              <div class="quest-checkbox">
                <div class="check-box-inner" :class="{ done: ch.completed }">
                  <span v-if="ch.completed">✓</span>
                  <span v-else>⚡</span>
                </div>
              </div>
              <div class="quest-details">
                <h4>{{ ch.name }}</h4>
                <p>{{ ch.description || 'Défi éducatif interactif avec questions à choix multiples.' }}</p>
                <div class="quest-meta-chips">
                  <span class="quest-xp-reward">+{{ ch.xp_reward || 30 }} XP</span>
                  <span class="quest-diff">{{ getDifficultyLabel(ch.difficulty) }}</span>
                  <span class="quest-score" v-if="ch.completed && ch.score !== null">Score : {{ ch.score }}/20</span>
                </div>
              </div>
              <button class="quest-action-btn" 
                      :class="{ replay: ch.completed }"
                      @click="startChallengeQuiz(ch)">
                {{ ch.completed ? 'Rejouer' : 'Relever !' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 4: ANALYSES & SMART STATS ==================== -->
        <div v-else-if="activeSegment === 'analytics'" class="analytics-view">
          <div class="analytics-intro premium-card ion-padding text-center">
            <h2>Bilan Ludique & Pédagogique</h2>
            <p>Statistiques calculées à partir des quiz, révisions et défis réalisés par l'élève.</p>
          </div>

          <!-- Circular Progress Rings Grid -->
          <div class="charts-flex-row">
            <!-- Metric 1: Points Totaux -->
            <div class="metric-card premium-card text-center">
              <div class="circle-chart-container">
                <div class="metric-circle-number">{{ totalXp }}</div>
              </div>
              <h4>Total XP</h4>
              <span class="status-tag status-high">{{ ludicStats.level_title || 'Novice' }}</span>
            </div>

            <!-- Metric 2: Moyenne Quiz -->
            <div class="metric-card premium-card text-center">
              <div class="circle-chart-container">
                <div class="metric-circle-number">{{ ludicStats.average_score !== null ? ludicStats.average_score : '—' }}</div>
              </div>
              <h4>Moyenne /20</h4>
              <span class="status-tag status-high" v-if="ludicStats.average_score >= 14">Très bien</span>
              <span class="status-tag status-mid" v-else>En progrès</span>
            </div>

            <!-- Metric 3: Activités Complétées -->
            <div class="metric-card premium-card text-center">
              <div class="circle-chart-container">
                <div class="metric-circle-number">{{ (ludicStats.completed_revisions_count || 0) + (ludicStats.completed_challenges_count || 0) }}</div>
              </div>
              <h4>Quiz Réussis</h4>
              <span class="status-tag status-high">Actif</span>
            </div>
          </div>

          <!-- Recent Submissions History -->
          <div class="section-title-row" style="margin-top: 25px;" v-if="ludicStats.recent_submissions && ludicStats.recent_submissions.length > 0">
            <h3>Historique des Derniers Quiz Joués</h3>
          </div>

          <div class="submissions-history-list" v-if="ludicStats.recent_submissions && ludicStats.recent_submissions.length > 0">
            <div v-for="sub in ludicStats.recent_submissions" 
                 :key="sub.id" 
                 class="history-card premium-card ion-padding">
              <div class="hist-flex">
                <div class="hist-info">
                  <h4>{{ sub.activity_type === 'daily_challenge' ? '⚡ Défi Journalier' : '📚 Révision Matière' }}</h4>
                  <span class="hist-date">{{ formatDate(sub.date) }}</span>
                </div>
                <div class="hist-score-box">
                  <span class="hist-score">{{ sub.score }}/20</span>
                  <span class="hist-xp">+{{ sub.xp_earned }} XP</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Smart Recommendations for Parents -->
          <div class="section-header" style="margin-top: 25px;">
            <h2>💡 Conseils Pédagogiques Personnalisés</h2>
          </div>

          <div class="tips-list">
            <div class="tip-detail-card premium-card ion-padding text-left behavior-tip">
              <div class="tip-card-header">
                <span class="tip-icon">🧠</span>
                <h3>Motivation & Entraînement Quotidien</h3>
              </div>
              <p>L'élève gagne des points ludiques à chaque révision complétée, ce qui renforce l'ancrage mémoriel.</p>
              <div class="ai-recommendation-box">
                🎯 <strong>Conseil :</strong> "Encouragez votre enfant à relever au moins un défi journalier chaque soir après ses devoirs pour consolider ses acquis."
              </div>
            </div>

            <div class="tip-detail-card premium-card ion-padding text-left presence-tip">
              <div class="tip-card-header">
                <span class="tip-icon">📈</span>
                <h3>Progression par Matière</h3>
              </div>
              <p>Les professeurs publient régulièrement des révisions ciblées pour préparer les évaluations sommatives.</p>
              <div class="ai-recommendation-box">
                🎯 <strong>Conseil :</strong> "Consultez les explications pédagogiques fournies par les professeurs à la fin de chaque quiz pour revoir les notions non assimilées."
              </div>
            </div>
          </div>
        </div>

      </div>
    </ion-content>

    <!-- Badge Details Modal -->
    <div v-if="selectedBadge" class="modal-overlay" @click="selectedBadge = null">
      <div class="badge-modal premium-card ion-padding text-center" @click.stop>
        <button class="modal-close-btn" @click="selectedBadge = null">×</button>
        <div class="modal-badge-icon" :style="{ background: selectedBadge.color }">
          <span>{{ selectedBadge.emoji }}</span>
        </div>
        <h2>{{ selectedBadge.title }}</h2>
        <span class="modal-xp" :style="{ color: selectedBadge.unlocked ? selectedBadge.color : '#94a3b8' }">
          {{ selectedBadge.unlocked ? '+' + selectedBadge.xp + ' XP' : 'Badge Verrouillé' }}
        </span>
        <p class="modal-desc">{{ selectedBadge.description }}</p>
        
        <div class="modal-meta-box">
          <div v-if="selectedBadge.unlocked">
            <span class="unlock-date">Badge Débloqué ! 🌟</span>
            <div class="encouragement-box">
              💬 <strong>Félicitations de l'établissement :</strong> "{{ selectedBadge.teacherNote }}"
            </div>
          </div>
          <div v-else>
            <span class="lock-req">Comment le débloquer : {{ selectedBadge.unlockCriteria }}</span>
          </div>
        </div>
        <button class="modal-action-btn" @click="selectedBadge = null">Fermer</button>
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonButtons, IonMenuButton,
  IonSpinner
} from '@ionic/vue';
import { ref, computed, onMounted, watch } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const activeSegment = ref('badges');

// --- LUDIC STATS & POINTS ---
const ludicStats = ref<any>({
  total_xp: 100,
  level_title: 'Apprenti Novice',
  level_badge: '🥉',
  next_level_xp: 250,
  progress_pct: 40,
  completed_revisions_count: 0,
  completed_challenges_count: 0,
  average_score: null,
  recent_submissions: []
});

const totalXp = computed(() => {
  return ludicStats.value.total_xp || 100;
});

// --- BADGES DATA ---
const selectedBadge = ref<any | null>(null);

const badgesList = computed(() => {
  const xp = totalXp.value;
  const revCount = ludicStats.value.completed_revisions_count || 0;
  const chCount = ludicStats.value.completed_challenges_count || 0;

  return [
    {
      id: 'badge-1',
      title: 'Novice Curieux',
      emoji: '🌱',
      xp: 50,
      color: '#10b981',
      unlocked: xp >= 50,
      description: "Attribué dès la première participation aux activités ludiques et éducatives.",
      teacherNote: "Bienvenue dans l'espace de réussite ! Continue à apprendre en t'amusant.",
      unlockCriteria: "Atteindre au moins 50 XP."
    },
    {
      id: 'badge-2',
      title: 'Grand Révisseur',
      emoji: '📚',
      xp: 100,
      color: '#6366f1',
      unlocked: revCount >= 1 || xp >= 150,
      description: "Attribué pour avoir complété et réussi des révisions de cours avec sérieux.",
      teacherNote: "Bravo pour ta régularité dans la révision de tes matières !",
      unlockCriteria: "Compléter au moins 1 révision complète."
    },
    {
      id: 'badge-3',
      title: 'Maître des Défis',
      emoji: '⚡',
      xp: 150,
      color: '#f59e0b',
      unlocked: chCount >= 1 || xp >= 250,
      description: "Attribué aux élèves qui relèvent avec brio les défis quotidiens de l'école.",
      teacherNote: "Une rapidité d'esprit et une motivation exceptionnelles !",
      unlockCriteria: "Compléter un défi journalier."
    },
    {
      id: 'badge-4',
      title: 'As du Calcul & Logique',
      emoji: '🧮',
      xp: 200,
      color: '#ec4899',
      unlocked: xp >= 300,
      description: "Attribué pour l'excellence en raisonnement mathématique et logique.",
      teacherNote: "Félicitations pour tes compétences en logique et calcul !",
      unlockCriteria: "Cumuler plus de 300 XP dans les quiz."
    },
    {
      id: 'badge-5',
      title: 'Plume d\'Or',
      emoji: '✒️',
      xp: 250,
      color: '#8b5cf6',
      unlocked: xp >= 450,
      description: "Attribué pour une maîtrise remarquable de la langue et de la rédaction.",
      teacherNote: "Un vocabulaire riche et une très belle rigueur littéraire !",
      unlockCriteria: "Atteindre 450 XP."
    },
    {
      id: 'badge-6',
      title: 'Légende de l\'École',
      emoji: '👑',
      xp: 500,
      color: '#e11d48',
      unlocked: xp >= 1000,
      description: "La plus haute distinction attribuée aux champions du savoir et de la camaraderie.",
      teacherNote: "Exemplaire à tous points de vue ! Toute l'équipe pédagogique te félicite.",
      unlockCriteria: "Atteindre 1000 XP ludiques."
    }
  ];
});

const unlockedBadgesCount = computed(() => {
  return badgesList.value.filter(b => b.unlocked).length;
});

const openBadgeDetails = (badge: any) => {
  selectedBadge.value = badge;
};

// --- REVISIONS & QUIZ STATE ---
const revisions = ref<any[]>([]);
const availableSubjects = ref<any[]>([]);
const selectedSubjectId = ref<number | null>(null);
const loadingRevisions = ref(false);

const quizMode = ref<'list' | 'playing' | 'result'>('list');
const activeQuiz = ref<any>(null);
const currentQuizQuestions = ref<any[]>([]);
const currentQuestionIndex = ref(0);
const selectedAnswers = ref<Record<number, string>>({});
const submittingQuiz = ref(false);
const quizResult = ref<any>({
  score: 0,
  correct_count: 0,
  total_questions: 0,
  xp_earned: 0,
  total_xp: 0,
  corrections: []
});

const currentQuestion = computed(() => {
  if (!currentQuizQuestions.value || currentQuizQuestions.value.length === 0) return null;
  return currentQuizQuestions.value[currentQuestionIndex.value];
});

const filteredRevisions = computed(() => {
  if (!selectedSubjectId.value) return revisions.value;
  return revisions.value.filter(r => r.subject_id && r.subject_id[0] === selectedSubjectId.value);
});

// --- DAILY CHALLENGES STATE ---
const dailyChallenges = ref<any[]>([]);
const loadingChallenges = ref(false);

const completedChallengesCount = computed(() => {
  return dailyChallenges.value.filter(c => c.completed).length;
});

// --- HELPERS ---
const getDifficultyLabel = (diff: string) => {
  if (diff === 'easy') return 'Facile 🟢';
  if (diff === 'hard') return 'Difficile 🔴';
  return 'Moyen 🟡';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getQuestionOptions = (q: any) => {
  const opts = [];
  if (q.option_a) opts.push({ key: 'A', text: q.option_a });
  if (q.option_b) opts.push({ key: 'B', text: q.option_b });
  if (q.option_c) opts.push({ key: 'C', text: q.option_c });
  if (q.option_d) opts.push({ key: 'D', text: q.option_d });
  return opts;
};

// --- DATA FETCHING ---
const fetchLudicStats = async () => {
  const sid = odoo.selectedStudentId;
  if (!sid) return;
  try {
    const res = await apiRequest('/api/school/student/ludic-stats', { student_id: sid });
    if (res && res.success) {
      ludicStats.value = res;
    }
  } catch (e) {
    console.warn('Erreur chargement ludic stats:', e);
  }
};

const fetchRevisions = async () => {
  const sid = odoo.selectedStudentId;
  loadingRevisions.value = true;
  try {
    const res = await apiRequest('/api/school/revisions', { 
      student_id: sid,
      activity_type: 'revision'
    });
    if (res && res.success) {
      revisions.value = res.revisions || [];
      availableSubjects.value = res.subjects || [];
    }
  } catch (e) {
    console.warn('Erreur chargement revisions:', e);
  } finally {
    loadingRevisions.value = false;
  }
};

const fetchDailyChallenges = async () => {
  const sid = odoo.selectedStudentId;
  loadingChallenges.value = true;
  try {
    const res = await apiRequest('/api/school/daily-challenges', { 
      student_id: sid 
    });
    if (res && res.success) {
      dailyChallenges.value = res.challenges || [];
    }
  } catch (e) {
    console.warn('Erreur chargement daily challenges:', e);
  } finally {
    loadingChallenges.value = false;
  }
};

const refreshAllData = async () => {
  await Promise.all([
    fetchLudicStats(),
    fetchRevisions(),
    fetchDailyChallenges()
  ]);
};

// --- QUIZ ACTIONS ---
const startQuiz = (rev: any) => {
  if (!rev.questions || rev.questions.length === 0) {
    alert("Cette révision ne contient aucune question pour le moment.");
    return;
  }
  activeQuiz.value = rev;
  currentQuizQuestions.value = rev.questions;
  currentQuestionIndex.value = 0;
  selectedAnswers.value = {};
  quizMode.value = 'playing';
};

const startChallengeQuiz = (ch: any) => {
  if (!ch.questions || ch.questions.length === 0) {
    alert("Ce défi ne contient aucune question pour le moment.");
    return;
  }
  activeQuiz.value = ch;
  currentQuizQuestions.value = ch.questions;
  currentQuestionIndex.value = 0;
  selectedAnswers.value = {};
  quizMode.value = 'playing';
};

const selectOption = (questionId: number, optKey: string) => {
  selectedAnswers.value[questionId] = optKey;
};

const confirmQuitQuiz = () => {
  if (confirm("Voulez-vous vraiment quitter ce quiz en cours ? Votre progression ne sera pas enregistrée.")) {
    quizMode.value = 'list';
  }
};

const submitQuizAnswers = async () => {
  const sid = odoo.selectedStudentId;
  if (!sid || !activeQuiz.value) return;

  submittingQuiz.value = true;
  try {
    const res = await apiRequest('/api/school/revisions/submit', {
      student_id: sid,
      revision_id: activeQuiz.value.id,
      answers: selectedAnswers.value
    });

    if (res && res.success) {
      quizResult.value = res;
      quizMode.value = 'result';
      // Refresh stats in background
      await fetchLudicStats();
      await fetchRevisions();
      await fetchDailyChallenges();
    } else {
      alert("Erreur lors de la validation du quiz.");
    }
  } catch (e: any) {
    console.error("Erreur submit quiz:", e);
    alert("Une erreur est survenue lors de l'envoi de vos réponses.");
  } finally {
    submittingQuiz.value = false;
  }
};

const backToRevisionList = () => {
  quizMode.value = 'list';
};

// --- LIFECYCLE ---
onMounted(() => {
  refreshAllData();
});

watch(() => odoo.selectedStudentId, () => {
  quizMode.value = 'list';
  refreshAllData();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.segment-container {
  padding: 10px;
  background: white;
}

.custom-segment {
  --background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}

ion-segment-button {
  --indicator-color: #5c2d54;
  --color: #64748b;
  --color-checked: #ffffff;
  --border-radius: 10px;
  font-weight: 750;
  font-size: 0.78rem;
  min-height: 40px;
}

/* Header success card */
.header-banner {
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.08) 0%, rgba(99, 102, 241, 0.12) 100%);
  border: 1px solid rgba(92, 45, 84, 0.12);
  margin-bottom: 20px;
  border-radius: 20px;
}
.banner-flex {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-trophy {
  font-size: 3.2rem;
  line-height: 1;
}
.banner-info {
  flex: 1;
}
.rank-tag {
  background: #5c2d54;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 4px;
}
.banner-info h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  color: #1e293b;
}
.xp-unit {
  font-size: 0.9rem;
  color: #6366f1;
}
.banner-info p {
  margin: 4px 0 8px;
  font-size: 0.8rem;
  color: #64748b;
}
.level-progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  overflow: hidden;
}
.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5c2d54 0%, #6366f1 100%);
  border-radius: 20px;
  transition: width 0.5s ease;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.section-title-row h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: #1e293b;
}
.unlocked-count {
  font-size: 0.8rem;
  font-weight: 750;
  color: #6366f1;
}

/* Badges Grid */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 25px;
}
.badge-card {
  padding: 16px 12px !important;
  background: white;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.badge-card:active {
  transform: scale(0.97);
}
.badge-card.locked {
  opacity: 0.65;
  filter: grayscale(0.5);
}
.badge-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 6px 15px rgba(0,0,0,0.08);
}
.badge-emoji {
  font-size: 2rem;
}
.lock-overlay {
  position: absolute;
  font-size: 1.2rem;
  bottom: -4px;
  right: -4px;
}
.badge-card h3 {
  margin: 0 0 4px;
  font-size: 0.88rem;
  font-weight: 850;
  color: #1e293b;
}
.badge-xp {
  font-size: 0.75rem;
  font-weight: 800;
}

/* Revisions View */
.revision-hero {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%);
  border: 1px solid rgba(99, 102, 241, 0.12);
  margin-bottom: 16px;
  border-radius: 20px;
}
.hero-icon {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 6px;
}
.revision-hero h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 850;
  color: #1e293b;
}
.revision-hero p {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
}

/* Subject Filter */
.subjects-filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 14px;
  scrollbar-width: none;
}
.subjects-filter-scroll::-webkit-scrollbar { display: none; }

.filter-pill {
  white-space: nowrap;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-pill.active {
  background: #5c2d54;
  color: white;
  border-color: #5c2d54;
}

/* Revision Cards */
.revisions-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.revision-card {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.subject-tag {
  font-size: 0.75rem;
  font-weight: 800;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 3px 8px;
  border-radius: 8px;
}
.difficulty-tag {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}
.difficulty-tag.easy { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.difficulty-tag.medium { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.difficulty-tag.hard { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.revision-title {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 850;
  color: #1e293b;
}
.revision-desc {
  margin: 0 0 12px;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
}
.revision-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 14px;
}
.meta-item.xp-gain {
  color: #f59e0b;
  font-weight: 800;
}
.card-footer-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.completed-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #10b981;
}
.check-icon {
  background: #10b981;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 900;
}
.not-completed-badge {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 600;
}
.play-btn {
  background: linear-gradient(135deg, #5c2d54 0%, #7d3c73 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(92, 45, 84, 0.2);
}

/* Quiz Play View */
.quiz-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.quiz-back-btn {
  background: none;
  border: none;
  color: #64748b;
  font-weight: 750;
  font-size: 0.85rem;
  cursor: pointer;
}
.quiz-progress-text {
  font-size: 0.88rem;
  color: #1e293b;
}
.quiz-xp-badge {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  padding: 4px 8px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.75rem;
}
.quiz-progress-track {
  height: 6px;
  background: #e2e8f0;
  border-radius: 10px;
  margin-bottom: 18px;
  overflow: hidden;
}
.quiz-progress-bar {
  height: 100%;
  background: #6366f1;
  transition: width 0.3s ease;
}

.quiz-question-card {
  background: white;
  border-radius: 22px;
  margin-bottom: 20px;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.q-seq {
  background: #5c2d54;
  color: white;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 6px;
}
.q-subject {
  font-size: 0.8rem;
  font-weight: 750;
  color: #64748b;
}
.question-text {
  margin: 0 0 20px;
  font-size: 1.15rem;
  font-weight: 850;
  color: #1e293b;
  line-height: 1.45;
}

.quiz-options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.quiz-option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}
.quiz-option-btn.selected {
  background: rgba(92, 45, 84, 0.08);
  border-color: #5c2d54;
}
.option-letter {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: white;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #334155;
  font-size: 0.9rem;
}
.quiz-option-btn.selected .option-letter {
  background: #5c2d54;
  color: white;
  border-color: #5c2d54;
}
.option-label {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 650;
  color: #1e293b;
}

.quiz-controls-row {
  display: flex;
  gap: 12px;
}
.quiz-nav-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
}
.quiz-nav-btn.prev {
  background: #e2e8f0;
  color: #475569;
}
.quiz-nav-btn.next {
  background: #6366f1;
  color: white;
}
.quiz-nav-btn.finish {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

/* Quiz Result View */
.result-hero-card {
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 22px;
  margin-bottom: 20px;
}
.result-trophy-anim {
  font-size: 3rem;
  margin-bottom: 8px;
}
.result-hero-card h2 {
  margin: 0 0 10px;
  font-size: 1.35rem;
  font-weight: 900;
  color: #1e293b;
}
.result-score-banner {
  margin: 10px 0;
}
.big-score {
  font-size: 2.5rem;
  font-weight: 950;
  color: #5c2d54;
}
.max-score {
  font-size: 1.2rem;
  color: #94a3b8;
}
.score-summary {
  margin: 0 0 14px;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 600;
}
.xp-earned-chip {
  display: inline-block;
  background: #f59e0b;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 850;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.corrections-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}
.correction-card {
  background: white;
  border-radius: 18px;
}
.correction-card.correct { border-left: 5px solid #10b981; }
.correction-card.incorrect { border-left: 5px solid #ef4444; }

.corr-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.corr-badge {
  font-size: 0.72rem;
  font-weight: 850;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.corr-badge.correct {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.corr-num {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
}
.corr-question {
  margin: 0 0 10px;
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
}
.corr-answers-box {
  background: #f8fafc;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 0.82rem;
}
.corr-answers-box p { margin: 2px 0; }
.user-ans.correct { color: #10b981; }
.correct-ans { color: #5c2d54; }
.explanation-box {
  background: #eff6ff;
  border: 1px dashed #bfdbfe;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #1e40af;
  line-height: 1.45;
}
.back-list-btn {
  background: #5c2d54;
  margin-bottom: 30px;
}

/* Quests View */
.quests-status {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(92, 45, 84, 0.08) 100%);
  border: 1px solid rgba(245, 158, 11, 0.15);
  margin-bottom: 16px;
  border-radius: 20px;
}
.quest-top-emoji {
  font-size: 2.2rem;
}
.quests-status h3 {
  margin: 4px 0;
  font-size: 1.15rem;
  font-weight: 850;
  color: #1e293b;
}
.quests-status p {
  margin: 0 0 10px;
  font-size: 0.82rem;
  color: #64748b;
}
.quests-progress-flex {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 750;
  color: #475569;
}
.quests-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.quests-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.quest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 18px;
}
.quest-item.completed {
  opacity: 0.8;
}
.check-box-inner {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #f59e0b;
}
.check-box-inner.done {
  background: #10b981;
  color: white;
}
.quest-details {
  flex: 1;
}
.quest-details h4 {
  margin: 0 0 4px;
  font-size: 0.92rem;
  font-weight: 850;
  color: #1e293b;
}
.quest-details p {
  margin: 0 0 6px;
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.35;
}
.quest-meta-chips {
  display: flex;
  gap: 8px;
  align-items: center;
}
.quest-xp-reward {
  font-size: 0.72rem;
  font-weight: 800;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
}
.quest-diff {
  font-size: 0.7rem;
  color: #64748b;
}
.quest-score {
  font-size: 0.72rem;
  font-weight: 800;
  color: #10b981;
}
.quest-action-btn {
  background: #5c2d54;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
}
.quest-action-btn.replay {
  background: #f1f5f9;
  color: #475569;
}

/* Analytics Tab */
.analytics-intro {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.06) 100%);
  border: 1px solid rgba(99, 102, 241, 0.1);
  margin-bottom: 16px;
  border-radius: 20px;
}
.analytics-intro h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 850;
  color: #1e293b;
}
.analytics-intro p {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.charts-flex-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.metric-card {
  flex: 1;
  padding: 14px 8px !important;
  background: white;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.circle-chart-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.metric-circle-number {
  font-size: 1rem;
  font-weight: 900;
  color: #5c2d54;
}
.metric-card h4 {
  margin: 4px 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #1e293b;
}
.status-tag {
  font-size: 0.65rem;
  font-weight: 750;
  padding: 2px 6px;
  border-radius: 20px;
}
.status-tag.status-high { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-tag.status-mid { background: rgba(245, 158, 11, 0.1); color: #d97706; }

.submissions-history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.history-card {
  background: white;
  border-radius: 14px;
  padding: 12px 14px !important;
}
.hist-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hist-info h4 {
  margin: 0 0 2px;
  font-size: 0.88rem;
  font-weight: 800;
  color: #1e293b;
}
.hist-date {
  font-size: 0.72rem;
  color: #94a3b8;
}
.hist-score-box {
  text-align: right;
}
.hist-score {
  display: block;
  font-size: 0.95rem;
  font-weight: 900;
  color: #5c2d54;
}
.hist-xp {
  font-size: 0.72rem;
  font-weight: 800;
  color: #f59e0b;
}

/* Tips */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.tip-detail-card {
  background: white;
  border-radius: 20px;
}
.tip-detail-card.behavior-tip { border-left: 5px solid #10b981; }
.tip-detail-card.presence-tip { border-left: 5px solid #f59e0b; }

.tip-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.tip-icon { font-size: 1.3rem; }
.tip-card-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: #1e293b;
}
.tip-detail-card p {
  margin: 0 0 10px;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
}
.ai-recommendation-box {
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #334155;
  line-height: 1.45;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.badge-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 360px;
  position: relative;
}
.modal-close-btn {
  position: absolute;
  top: 14px; right: 16px;
  background: none; border: none;
  font-size: 1.5rem; color: #94a3b8;
  cursor: pointer;
}
.modal-badge-icon {
  width: 76px; height: 76px;
  border-radius: 22px;
  display: flex; align-items: center; justify-content: center;
  margin: 10px auto 14px;
  font-size: 2.6rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
}
.badge-modal h2 { margin: 0; font-weight: 900; color: #1e293b; font-size: 1.25rem; }
.modal-xp { font-weight: 800; font-size: 0.9rem; display: block; margin-top: 4px; }
.modal-desc { color: #64748b; font-size: 0.85rem; line-height: 1.45; margin: 12px 0; font-weight: 550; }
.modal-meta-box {
  background: #f8fafc;
  padding: 12px;
  border-radius: 14px;
  margin-bottom: 18px;
}
.unlock-date {
  font-size: 0.75rem; font-weight: 800; color: #10b981; display: block; margin-bottom: 6px;
}
.encouragement-box {
  font-size: 0.78rem; color: #475569; line-height: 1.4; text-align: left;
}
.lock-req {
  font-size: 0.8rem; font-weight: 750; color: #ef4444; display: block;
}
.modal-action-btn {
  background: #5c2d54;
  color: white; border: none;
  width: 100%; padding: 12px;
  border-radius: 12px; font-weight: 800;
  cursor: pointer; font-size: 0.9rem;
}
</style>
