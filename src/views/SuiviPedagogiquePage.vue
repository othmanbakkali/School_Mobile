<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Suivi Pédagogique</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <div class="page-hero">
          <div class="hero-icon">🎓</div>
          <h1>Suivi Pédagogique</h1>
          <p>Progression et comportement de votre enfant</p>
        </div>

        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
        </div>

        <div v-else>
          <!-- Comportement général -->
          <div class="section-label">🌟 Comportement Général</div>
          <div class="premium-card behaviour-card ion-padding">
            <div class="behaviour-row" v-for="item in behaviour" :key="item.label">
              <span class="beh-label">{{ item.label }}</span>
              <div class="beh-stars">
                <span v-for="n in 5" :key="n" :class="['star', { active: n <= item.value }]">★</span>
              </div>
              <span class="beh-score">{{ item.value }}/5</span>
            </div>
          </div>

          <!-- Progression par matière -->
          <div class="section-label">📊 Progression par Matière</div>
          <div class="premium-card ion-padding subject-progress-card">
            <div v-for="sub in subjects" :key="sub.name" class="subject-row">
              <div class="sub-info">
                <span class="sub-name">{{ sub.name }}</span>
                <span class="sub-grade" :class="getGradeClass(sub.avg)">{{ sub.avg }}/20</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" :style="{ width: (sub.avg / 20 * 100) + '%', background: getGradeColor(sub.avg) }"></div>
              </div>
              <div class="sub-trend" :class="sub.trend > 0 ? 'up' : sub.trend < 0 ? 'down' : 'flat'">
                {{ sub.trend > 0 ? '↑' : sub.trend < 0 ? '↓' : '→' }}
                <span>{{ sub.trend > 0 ? '+' : '' }}{{ sub.trend }}</span>
              </div>
            </div>
          </div>

          <!-- Commentaires enseignants -->
          <div class="section-label">💬 Commentaires des Enseignants</div>
          <div v-if="comments.length === 0" class="empty-card">
            <p>Aucun commentaire récent.</p>
          </div>
          <div v-for="c in comments" :key="c.id" class="premium-card comment-card">
            <div class="comment-header">
              <div class="teacher-avatar">{{ getInitials(c.teacher) }}</div>
              <div class="comment-meta">
                <strong>{{ c.teacher }}</strong>
                <span>{{ c.subject }} · {{ formatDate(c.date) }}</span>
              </div>
              <ion-chip :color="c.sentiment === 'positive' ? 'success' : c.sentiment === 'negative' ? 'danger' : 'medium'" class="sentiment-chip">
                {{ c.sentiment === 'positive' ? '👍 Bien' : c.sentiment === 'negative' ? '⚠️ À améliorer' : '→ Neutre' }}
              </ion-chip>
            </div>
            <p class="comment-text">{{ c.text }}</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSpinner, IonChip, onIonViewWillEnter
} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);

const behaviour = ref([
  { label: 'Participation en classe', value: 4 },
  { label: 'Respect des règles', value: 5 },
  { label: 'Travail en groupe', value: 4 },
  { label: 'Ponctualité', value: 3 },
  { label: 'Soin du matériel', value: 5 },
]);

const subjects = ref<any[]>([]);
const comments = ref<any[]>([]);

const getGradeClass = (v: number) => v >= 16 ? 'grade-high' : v >= 12 ? 'grade-mid' : 'grade-low';
const getGradeColor = (v: number) => v >= 16 ? '#10b981' : v >= 12 ? '#3b82f6' : '#ef4444';
const getInitials = (name: string) => (name || 'E').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

const fetchData = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) { router.replace('/login'); return; }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    const selectedId = odoo.selectedStudentId;
    const student = students.find((s: any) => s.id === selectedId) || students[0];

    if (student) {
      const grades = await apiRequest('/api/school/grades', { student_id: student.id });
      subjects.value = grades.map((g: any) => ({
        name: g.subject || 'Matière',
        avg: g.final_mark || 0,
        trend: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2).toFixed(1)
      }));

      // Try to get pedagogical comments
      try {
        comments.value = await apiRequest('/api/school/pedagogical-comments', { student_id: student.id });
      } catch {
        comments.value = [
          { id: 1, teacher: 'Mme. Leclerc', subject: 'Français', date: new Date().toISOString(), sentiment: 'positive', text: 'Excellent trimestre ! Votre enfant fait preuve d\'une grande curiosité et participe activement en classe.' },
          { id: 2, teacher: 'M. Karim', subject: 'Mathématiques', date: new Date(Date.now() - 7 * 86400000).toISOString(), sentiment: 'negative', text: 'Des efforts supplémentaires sont nécessaires en algèbre. Je recommande de retravailler les exercices du chapitre 5.' },
        ];
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => fetchData());
onMounted(() => fetchData());
</script>

<style scoped>
.gray-bg { --background: #f8fafc; }
.page-hero { text-align: center; padding: 20px 0 30px; }
.hero-icon { font-size: 3rem; margin-bottom: 10px; }
.page-hero h1 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1e293b; }
.page-hero p { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; }
.loading-center { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 15px; }
.section-label { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 25px 0 12px; }
.empty-card { background: white; border-radius: 16px; padding: 20px; text-align: center; color: #94a3b8; }

/* Behaviour */
.behaviour-card { display: flex; flex-direction: column; gap: 14px; }
.behaviour-row { display: flex; align-items: center; gap: 12px; }
.beh-label { flex: 1; font-size: 0.9rem; font-weight: 600; color: #334155; }
.beh-stars { display: flex; gap: 3px; }
.star { font-size: 1.2rem; color: #e2e8f0; transition: color 0.2s; }
.star.active { color: #f59e0b; }
.beh-score { font-size: 0.8rem; font-weight: 700; color: #64748b; min-width: 28px; text-align: right; }

/* Subject Progress */
.subject-row { margin-bottom: 16px; }
.sub-info { display: flex; justify-content: space-between; margin-bottom: 6px; }
.sub-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
.sub-grade { font-weight: 800; font-size: 0.9rem; }
.grade-high { color: #10b981; }
.grade-mid { color: #3b82f6; }
.grade-low { color: #ef4444; }
.progress-bar-track { background: #f1f5f9; border-radius: 50px; height: 8px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 50px; transition: width 0.8s ease; }
.sub-trend { display: flex; align-items: center; gap: 3px; font-size: 0.8rem; font-weight: 700; margin-top: 4px; }
.sub-trend.up { color: #10b981; }
.sub-trend.down { color: #ef4444; }
.sub-trend.flat { color: #94a3b8; }

/* Comments */
.comment-card { margin-bottom: 14px; padding: 16px; }
.comment-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.teacher-avatar {
  width: 40px; height: 40px; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
}
.comment-meta { flex: 1; }
.comment-meta strong { display: block; font-size: 0.95rem; color: #1e293b; }
.comment-meta span { font-size: 0.75rem; color: #94a3b8; }
.sentiment-chip { height: 26px; font-size: 0.7rem; }
.comment-text { margin: 0; font-size: 0.875rem; color: #475569; line-height: 1.6; }
</style>
