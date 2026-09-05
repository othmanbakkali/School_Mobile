<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Emploi du Temps</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <!-- Student Header Badge -->
      <StudentHeaderBadge />

      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary"/>
        <p>Chargement de l'emploi du temps...</p>
      </div>

      <div v-else class="fade-in">
        <!-- Day Scroll Selector -->
        <div class="day-scroll">
          <div v-for="d in [0,1,2,3,4,5,6]" :key="d" 
               :class="['day-bubble', { active: activeScheduleDay === d.toString() }]"
               @click="activeScheduleDay = d.toString()">
            {{ getDayName(d.toString()).substring(0, 3) }}
          </div>
        </div>

        <div v-if="!groupedSchedule[activeScheduleDay] || groupedSchedule[activeScheduleDay].length === 0" class="empty-state">
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
              <p v-if="lesson.teacher">
                <ion-icon :icon="personOutline"></ion-icon> 
                {{ lesson.teacher }}
              </p>
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
  IonIcon, IonSpinner, IonButtons, IonMenuButton
} from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const router = useRouter();
const schedule = ref<any[]>([]);
const loading = ref(true);
const activeScheduleDay = ref((new Date().getDay() === 0 ? 6 : new Date().getDay() - 1).toString());

const groupedSchedule = computed(() => {
  const groups: any = {};
  schedule.value.forEach(item => {
    if (!groups[item.day_of_week]) groups[item.day_of_week] = [];
    groups[item.day_of_week].push(item);
  });
  // Sort lessons in each day by start_time
  Object.keys(groups).forEach(day => {
    groups[day].sort((a: any, b: any) => a.start_time - b.start_time);
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
      
      if (levelId) {
        schedule.value = await odoo.getSchedule(levelId);
      } else {
        schedule.value = [];
        console.warn('Student has no level assigned. Schedule will be empty.');
      }
    }
  } catch (e: any) {
    console.error('Erreur chargement emploi du temps:', e);
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

/* Schedule */
.day-section { margin-bottom: 25px; }
.lesson-card { display: flex; gap: 20px; align-items: center; padding: 18px 20px; margin-bottom: 12px; border-left: 6px solid #6366f1; background: #ffffff; }
.lesson-time { display: flex; flex-direction: column; align-items: center; min-width: 60px; font-weight: 800; color: #334155; font-size: 0.9rem; }
.time-line { width: 2px; height: 18px; background: #cbd5e1; margin: 3px 0; }
.time-start { color: #0f172a; }
.time-end { color: #64748b; }
.lesson-info { flex: 1; }
.lesson-info h4 { margin: 0; font-weight: 800; color: #0f172a; font-size: 1.1rem; text-transform: capitalize; }
.lesson-info p { margin: 6px 0 0; font-size: 0.9rem; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.lesson-info p ion-icon { color: #6366f1; font-size: 1.1rem; }

/* Day Scroll Selector */
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
