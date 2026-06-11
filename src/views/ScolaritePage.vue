
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Scolarité</ion-title>
      </ion-toolbar>
      <div class="segment-container">
        <ion-segment v-model="selectedSegment" mode="md" class="custom-segment">
          <ion-segment-button value="homework">
            <ion-label>Devoirs</ion-label>
          </ion-segment-button>
          <ion-segment-button value="notes">
            <ion-label>Notes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="absences">
            <ion-label>Absences</ion-label>
          </ion-segment-button>
          <ion-segment-button value="schedule">
            <ion-label>Emploi du Temps</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary"/>
        <p>Chargement...</p>
      </div>

      <div v-else class="fade-in">
        <!-- ==================== DEVOIRS ==================== -->
        <div v-if="selectedSegment === 'homework'">
          <div v-if="homeworks.length === 0" class="empty-state">
            📚 Aucun devoir en cours.
          </div>
          <div v-for="item in homeworks" :key="item.id" class="premium-card homework-card ion-padding">
            <div class="hw-top">
              <span class="subject-badge">{{ item.subject || 'Matière' }}</span>
              <div class="due-timer">
                <ion-icon :icon="timeOutline"></ion-icon>
                <span>{{ formatDate(item.date_due) }}</span>
              </div>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <div class="hw-bottom">
              <div class="status-indicator">
                <div class="status-dot" :class="item.state"></div>
                <span>{{ item.state === 'draft' ? 'En cours' : 'Fait' }}</span>
              </div>
              <div v-if="item.attachment" class="hw-attachment" @click.stop="downloadAttachment(item)">
                <ion-icon :icon="documentAttachOutline"></ion-icon>
                <span>Fichier</span>
              </div>
              <ion-button 
                v-if="item.state === 'draft'"
                size="small" 
                fill="clear" 
                class="done-btn"
                @click.stop="toggleStatus(item)"
              >
                ✓ Marquer comme fait
              </ion-button>
            </div>
          </div>
        </div>

        <!-- ==================== NOTES ==================== -->
        <div v-else-if="selectedSegment === 'notes'" class="notes-view">
          <!-- Filtre Semestre -->
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
              <span class="subject-title">{{ note.subject || 'Matière' }}</span>
              <div class="final-score" :class="getGradeClass(note.final_mark)">
                {{ note.final_mark }}
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
          </div>
        </div>

        <!-- ==================== ABSENCES ==================== -->
        <div v-else-if="selectedSegment === 'absences'" class="absences-view">
          <!-- Compteurs -->
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

        <!-- ==================== EMPLOI DU TEMPS ==================== -->
        <div v-else-if="selectedSegment === 'schedule'" class="schedule-view">
          <div class="day-scroll">
            <div v-for="d in [0,1,2,3,4,5,6]" :key="d" 
                 :class="['day-bubble', { active: activeScheduleDay === d.toString() }]"
                 @click="activeScheduleDay = d.toString()">
              {{ getDayName(d.toString()).substring(0, 3) }}
            </div>
          </div>

          <div v-if="!groupedSchedule[activeScheduleDay]" class="empty-state">
            📅 Aucun cours prévu pour ce jour.
          </div>
          
          <div v-else class="day-section">
            <div v-for="lesson in groupedSchedule[activeScheduleDay]" :key="lesson.id" class="lesson-card premium-card">
              <div class="lesson-time">
                <span class="time-start">{{ formatTime(lesson.start_time) }}</span>
                <div class="time-line"></div>
                <span class="time-end">{{ formatTime(lesson.end_time) }}</span>
              </div>
              <div class="lesson-info">
                <h4>{{ lesson.subject }}</h4>
                <p v-if="lesson.teacher"><ion-icon :icon="personOutline"></ion-icon> {{ lesson.teacher }}</p>
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
  IonSegment, IonSegmentButton, IonLabel, IonIcon, IonSpinner,
  IonButton, IonButtons, IonMenuButton, onIonViewWillEnter
} from '@ionic/vue';
import { timeOutline, personOutline, documentAttachOutline } from 'ionicons/icons';
import { ref, computed, onMounted, watch } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const selectedSegment = ref('homework');
const homeworks = ref<any[]>([]);
const notes = ref<any[]>([]);
const attendances = ref<any[]>([]);
const schedule = ref<any[]>([]);
const loading = ref(true);
const activeScheduleDay = ref((new Date().getDay() === 0 ? 6 : new Date().getDay() - 1).toString());
const selectedSemester = ref('S1');

const filteredNotes = computed(() => {
  return notes.value.filter(n => n.semester === selectedSemester.value);
});

// Compteurs absences
const absenceCount = computed(() => attendances.value.filter(a => a.type === 'absence').length);
const lateCount = computed(() => attendances.value.filter(a => a.type === 'late').length);
const justifiedCount = computed(() => attendances.value.filter(a => a.is_justified).length);

// Groupement emploi du temps
const groupedSchedule = computed(() => {
  const groups: any = {};
  schedule.value.forEach(item => {
    if (!groups[item.day_of_week]) groups[item.day_of_week] = [];
    groups[item.day_of_week].push(item);
  });
  return groups;
});

const getDayName = (day: string) => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  return days[parseInt(day)] || day;
};

const formatTime = (floatTime: number) => {
  const hours = Math.floor(floatTime);
  const minutes = Math.round((floatTime - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const formatDatetime = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getGradeClass = (val: number) => {
  if (val >= 16) return 'grade-high';
  if (val >= 12) return 'grade-mid';
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
      const levelId = student.level_id?.[0];
      
      const bodyWithId = { student_id: student.id };

      // Devoirs (par étudiant car attribués individuellement)
      homeworks.value = await apiRequest('/api/school/homework', bodyWithId);
      
      // Notes & Absences (par étudiant)
      notes.value = await apiRequest('/api/school/grades', bodyWithId);
      attendances.value = await apiRequest('/api/school/attendance', bodyWithId);

      // Emploi du temps (par classe/niveau)
      if (levelId) {
        console.log('Fetching schedule for level:', levelId);
        schedule.value = await odoo.getSchedule(levelId);
      } else {
        console.warn('Student has no level assigned. Schedule will be empty.');
      }
    } else {
      console.warn('No student found or selected.');
    }
  } catch (e: any) {
    console.error('Erreur chargement données scolarité:', e);
    if (e.message?.includes('401') || e.message?.includes('Not logged in')) {
      odoo.logout();
      router.replace('/login');
    }
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (item: any) => {
  try {
    const newState = item.state === 'draft' ? 'done' : 'draft';
    await apiRequest('/api/school/homework/status', {
      homework_id: item.id,
      state: newState
    });
    item.state = newState;
  } catch (e) {
    console.error('Failed to update status', e);
  }
};

const downloadAttachment = (item: any) => {
  if (!item.attachment) return;
  const link = document.createElement('a');
  link.href = `data:application/octet-stream;base64,${item.attachment}`;
  link.download = item.attachment_name || 'devoir_piece_jointe';
  link.click();
};

onIonViewWillEnter(() => {
  if (route.query.tab) {
    selectedSegment.value = route.query.tab as string;
  }
  fetchData();
});

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    selectedSegment.value = newTab as string;
  }
});

onMounted(() => {
  if (route.query.tab) {
    selectedSegment.value = route.query.tab as string;
  }
  fetchData();
});
</script>

<style scoped>
/* Segment */
.custom-segment {
  max-width: 95%;
  margin: 0 auto 15px auto;
  --background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}
ion-segment-button {
  --indicator-color: #6366f1;
  --color: #64748b;
  --color-checked: #ffffff;
  --border-radius: 10px;
  font-weight: 600;
  min-height: 38px;
  font-size: 0.85rem;
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

/* Devoirs */
.homework-card { margin-bottom: 16px; border-left: 4px solid #6366f1; }
.hw-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.subject-badge {
  padding: 4px 10px; border-radius: 8px;
  background: rgba(99, 102, 241, 0.1); color: #6366f1;
  font-size: 0.75rem; font-weight: 700;
}
.due-timer { display: flex; align-items: center; gap: 4px; color: #ef4444; font-size: 0.8rem; font-weight: 600; }
.homework-card h3 { margin: 0 0 6px; font-weight: 700; color: #1e293b; font-size: 1rem; }
.homework-card p { color: #64748b; font-size: 0.9rem; margin: 0 0 12px; }
.hw-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.hw-attachment {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  cursor: pointer;
}

.status-indicator {
 display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #64748b; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; }
.status-dot.done { background: #10b981; }
.done-btn { --color: #10b981; font-weight: 700; font-size: 0.75rem; --padding-end: 0; }

/* Notes */
.semester-filter {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.mini-segment {
  max-width: 250px;
  --background: #e2e8f0;
}
.note-card-detailed {
  margin-bottom: 16px;
  padding: 16px;
}
.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e2e8f0;
}
.subject-title {
  font-weight: 800;
  color: #1e293b;
  font-size: 1.1rem;
}
.final-score {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
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

/* Schedule */
.day-section { margin-bottom: 25px; }
.day-header { margin-bottom: 12px; padding-left: 5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
.day-header h3 { font-size: 1.2rem; font-weight: 800; color: #6366f1; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.lesson-card { display: flex; gap: 20px; align-items: center; padding: 18px 20px; margin-bottom: 12px; border-left: 6px solid #6366f1; background: #ffffff; }
.lesson-time { display: flex; flex-direction: column; align-items: center; min-width: 60px; font-weight: 800; color: #334155; font-size: 0.9rem; }
.time-line { width: 2px; height: 18px; background: #cbd5e1; margin: 3px 0; }
.time-start { color: #0f172a; }
.time-end { color: #64748b; }
.lesson-info { flex: 1; }
.lesson-info h4 { margin: 0; font-weight: 800; color: #0f172a; font-size: 1.1rem; text-transform: capitalize; }
.lesson-info p { margin: 6px 0 0; font-size: 0.9rem; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.lesson-info p ion-icon { color: #6366f1; font-size: 1.1rem; }

/* Day Scroll (Same as Tab3) */
.day-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}
.day-scroll::-webkit-scrollbar { display: none; }
.day-bubble {
  padding: 10px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 800;
  color: #1e293b;
  min-width: 70px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.day-bubble.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}
</style>
