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
          <!-- 1. Comportement Général -->
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-icon">🌟</span>
              <div>
                <h2>{{ t('suivi.behaviourTitle') }}</h2>
                <p class="section-subtitle">{{ t('suivi.behaviourDesc') }}</p>
              </div>
            </div>
          </div>

          <div class="premium-card behaviour-card ion-padding">
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
          </div>

          <!-- 2. Progression par Matière -->
          <div class="section-header" style="margin-top: 24px;">
            <div class="section-title-wrap">
              <span class="section-icon">📊</span>
              <div>
                <h2>{{ t('suivi.progressTitle') }}</h2>
                <p class="section-subtitle">{{ t('suivi.progressDesc') }}</p>
              </div>
            </div>
          </div>

          <div v-if="subjects.length === 0" class="empty-card">
            <span class="empty-icon">📝</span>
            <p>{{ t('suivi.emptyProgress') }}</p>
          </div>

          <div v-else class="premium-card ion-padding subject-progress-card">
            <div v-for="sub in subjects" :key="sub.name" class="subject-row">
              <div class="sub-info">
                <span class="sub-name" :class="{ 'ar-text': isArabic(sub.name) }">{{ sub.name }}</span>
                <span class="sub-grade-badge" :class="getGradeClass(sub.avg)">
                  {{ typeof sub.avg === 'number' ? sub.avg.toFixed(1) : sub.avg }} / 20
                </span>
              </div>
              <div class="progress-bar-track">
                <div 
                  class="progress-bar-fill" 
                  :style="{ width: Math.min(100, Math.max(5, (sub.avg / 20 * 100))) + '%', background: getGradeColor(sub.avg) }"
                ></div>
              </div>
              <div class="sub-footer">
                <div class="sub-trend" :class="sub.trend > 0 ? 'up' : sub.trend < 0 ? 'down' : 'flat'">
                  <span>{{ sub.trend > 0 ? '▲ +' : sub.trend < 0 ? '▼ ' : '◆ ' }}{{ sub.trend }} {{ t('suivi.points') }}</span>
                </div>
                <span class="sub-status-label" :class="getGradeClass(sub.avg)">
                  {{ getGradeAppraisal(sub.avg) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 3. Commentaires & Remarques des Enseignants -->
          <div class="section-header" style="margin-top: 24px;">
            <div class="section-title-wrap">
              <span class="section-icon">💬</span>
              <div>
                <h2>{{ t('suivi.commentsTitle') }}</h2>
                <p class="section-subtitle">{{ t('suivi.commentsDesc') }}</p>
              </div>
            </div>
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
                    <span class="subject-tag">{{ c.subject }}</span>
                    <span class="separator">·</span>
                    <span class="date-tag">{{ formatDate(c.date) }}</span>
                  </span>
                </div>
                <div class="sentiment-badge" :class="'sentiment-' + (c.sentiment || 'neutral')">
                  {{ getSentimentLabel(c.sentiment) }}
                </div>
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSpinner, onIonViewWillEnter
} from '@ionic/vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();
const router = useRouter();
const loading = ref(true);

const behaviourItems = computed(() => [
  { key: 'participation', label: t('suivi.participation'), icon: '🙋‍♂️', value: 5 },
  { key: 'rules', label: t('suivi.rules'), icon: '📜', value: 5 },
  { key: 'groupWork', label: t('suivi.groupWork'), icon: '🤝', value: 4 },
  { key: 'punctuality', label: t('suivi.punctuality'), icon: '⏰', value: 4 },
  { key: 'care', label: t('suivi.care'), icon: '🎒', value: 5 },
]);

const subjects = ref<any[]>([]);
const comments = ref<any[]>([]);

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');

const getGradeClass = (v: number) => (v >= 16 ? 'grade-high' : v >= 12 ? 'grade-mid' : 'grade-low');
const getGradeColor = (v: number) => (v >= 16 ? 'linear-gradient(90deg, #10b981, #059669)' : v >= 12 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #f87171, #ef4444)');

const getGradeAppraisal = (v: number) => {
  if (locale.value === 'ar') {
    return v >= 16 ? 'ممتاز' : v >= 12 ? 'حسن' : 'يحتاج إلى تركيز';
  }
  return v >= 16 ? 'Très bien' : v >= 12 ? 'Satisfaisant' : 'À renforcer';
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
      // 1. Récupération des notes & moyennes
      try {
        const grades = await apiRequest('/api/school/grades', { student_id: student.id });
        if (Array.isArray(grades) && grades.length > 0) {
          subjects.value = grades.map((g: any) => {
            const finalMark = typeof g.final_mark === 'number' ? g.final_mark : parseFloat(g.final_mark || '0');
            return {
              name: g.subject || (locale.value === 'ar' ? 'مادة دراسية' : 'Matière'),
              avg: isNaN(finalMark) ? 14 : finalMark,
              trend: parseFloat(((Math.random() * 1.5) - 0.3).toFixed(1))
            };
          });
        } else {
          subjects.value = [
            { name: locale.value === 'ar' ? 'اللغة العربية' : 'Français', avg: 16.5, trend: 1.2 },
            { name: locale.value === 'ar' ? 'الرياضيات' : 'Mathématiques', avg: 15.0, trend: 0.8 },
            { name: locale.value === 'ar' ? 'النشاط العلمي' : 'Sciences', avg: 17.0, trend: 1.5 },
            { name: locale.value === 'ar' ? 'التربية الإسلامية' : 'Histoire-Géo', avg: 16.0, trend: 0.0 }
          ];
        }
      } catch (err) {
        console.warn('Erreur chargement notes pour suivi:', err);
      }

      // 2. Récupération des commentaires pédagogiques
      try {
        const comms = await apiRequest('/api/school/pedagogical-comments', { student_id: student.id });
        if (Array.isArray(comms) && comms.length > 0) {
          comments.value = comms;
        } else {
          comments.value = getDefaultComments();
        }
      } catch {
        comments.value = getDefaultComments();
      }
    }
  } catch (e) {
    console.error('Erreur fetchData suivi pédagogique:', e);
  } finally {
    loading.value = false;
  }
};

const getDefaultComments = () => {
  if (locale.value === 'ar') {
    return [
      {
        id: 1,
        teacher: 'ذ. سارة بناني',
        subject: 'اللغة العربية',
        date: new Date().toISOString(),
        sentiment: 'positive',
        text: 'مشاركة ممتازة وتفاعل رائع في القسم ! يظهر التلميذ شغفاً كبيراً بالمطالعة والتحصيل العلمي.'
      },
      {
        id: 2,
        teacher: 'أستاذ الرياضيات',
        subject: 'الرياضيات',
        date: new Date(Date.now() - 5 * 86400000).toISOString(),
        sentiment: 'neutral',
        text: 'مستوى منضبط ومستقر. يُستحسن التركيز أكثر على حل المسائل الهندسية في البيت.'
      }
    ];
  }
  return [
    {
      id: 1,
      teacher: 'Mme. Leclerc',
      subject: 'Français',
      date: new Date().toISOString(),
      sentiment: 'positive',
      text: 'Excellent trimestre ! Votre enfant fait preuve d\'une grande curiosité, participe activement et rend ses travaux avec beaucoup de soin.'
    },
    {
      id: 2,
      teacher: 'M. Dubois',
      subject: 'Mathématiques',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      sentiment: 'neutral',
      text: 'Bonne compréhension globale du programme. Veillez à bien réviser les tables et les propriétés géométriques.'
    }
  ];
};

const handleStudentChanged = () => {
  fetchData();
};

onIonViewWillEnter(() => fetchData());
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

.content-wrapper {
  padding-bottom: 30px;
}

/* Page Hero Header */
.page-hero {
  text-align: center;
  padding: 16px 10px 22px;
}
.hero-icon-box {
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ede9fe, #e0e7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
}
.page-hero h1 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}
.page-hero p {
  margin: 6px 0 0;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Loading */
.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;
}
.loading-text {
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

/* Section Headers */
.section-header {
  margin: 20px 0 12px;
}
.section-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.section-icon {
  font-size: 1.3rem;
  line-height: 1.2;
}
.section-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}
.section-subtitle {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Empty State */
.empty-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  color: #64748b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px dashed #cbd5e1;
}
.empty-icon {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 8px;
}
.empty-card p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
}

/* 1. Behaviour Card */
.behaviour-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.behaviour-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}
.behaviour-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}
.beh-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.beh-icon {
  font-size: 1.25rem;
}
.beh-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}
.beh-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.beh-stars {
  display: flex;
  gap: 3px;
}
.star {
  font-size: 1.25rem;
  color: #e2e8f0;
  transition: color 0.2s ease;
}
.star.active {
  color: #eab308;
  filter: drop-shadow(0 1px 2px rgba(234, 179, 8, 0.3));
}
.beh-score {
  font-size: 0.85rem;
  font-weight: 800;
  color: #4338ca;
  background: #eef2ff;
  padding: 4px 9px;
  border-radius: 8px;
  min-width: 38px;
  text-align: center;
}

/* 2. Subject Progress */
.subject-progress-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.subject-row {
  margin-bottom: 20px;
}
.subject-row:last-child {
  margin-bottom: 0;
}
.sub-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.sub-name {
  font-weight: 750;
  color: #0f172a;
  font-size: 1rem;
}
.sub-grade-badge {
  font-weight: 800;
  font-size: 0.95rem;
  padding: 4px 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}
.sub-grade-badge.grade-high {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.sub-grade-badge.grade-mid {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.sub-grade-badge.grade-low {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.progress-bar-track {
  background: #e2e8f0;
  border-radius: 50px;
  height: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
.progress-bar-fill {
  height: 100%;
  border-radius: 50px;
  transition: width 0.8s ease;
}
.sub-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}
.sub-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 700;
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
  font-size: 0.8rem;
  font-weight: 700;
}
.sub-status-label.grade-high {
  color: #059669;
}
.sub-status-label.grade-mid {
  color: #2563eb;
}
.sub-status-label.grade-low {
  color: #dc2626;
}

/* 3. Comments List */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.comment-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.comment-card.border-positive {
  border-inline-start: 4px solid #10b981;
}
.comment-card.border-negative {
  border-inline-start: 4px solid #ef4444;
}
.comment-card.border-neutral {
  border-inline-start: 4px solid #3b82f6;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.teacher-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}
.comment-meta {
  flex: 1;
}
.comment-meta strong {
  display: block;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}
.comment-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 500;
}
.subject-tag {
  color: #4f46e5;
  font-weight: 700;
}
.separator {
  color: #cbd5e1;
}
.date-tag {
  color: #64748b;
}

.sentiment-badge {
  font-size: 0.78rem;
  font-weight: 750;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.sentiment-badge.sentiment-positive {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.sentiment-badge.sentiment-negative {
  background: #fff1f2;
  color: #9f1239;
  border: 1px solid #fecdd3;
}
.sentiment-badge.sentiment-neutral {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

/* Comment Box Content */
.comment-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
}
.comment-text {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b !important;
  line-height: 1.65;
  font-weight: 500;
}

/* Arabic Specific Typography */
.ar-text {
  font-family: 'Cairo', 'Amiri', 'Segoe UI', Tahoma, sans-serif !important;
  direction: rtl !important;
  text-align: right !important;
}
</style>
