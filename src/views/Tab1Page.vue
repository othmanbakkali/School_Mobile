
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar" mode="md">
        <ion-buttons slot="start">
          <ion-button class="profile-btn">
            <ion-avatar>
              <img :src="studentData?.photo ? `data:image/png;base64,${studentData.photo}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (studentData?.display_name || studentData?.name || 'Student')" />
            </ion-avatar>
          </ion-button>
        </ion-buttons>
        <ion-title>Tableau de Bord</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" color="medium">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button color="primary" @click="viewNotifications">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <ion-badge v-if="notificationsCount > 0" color="danger">{{ notificationsCount }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="fade-in" v-if="studentData">
        <div class="welcome-header">
          <h1>Bonjour, <span class="gradient-text">{{ studentData.parent_id?.[1] || 'Parent' }}</span> 👋</h1>
          <p>Voici ce qui se passe à l'école aujourd'hui.</p>
        </div>

        <!-- Multi-Child Selector -->
        <div v-if="allStudents.length > 1" class="child-selector">
          <div 
            v-for="s in allStudents" 
            :key="s.id" 
            class="child-thumb" 
            :class="{ active: s.id === studentData.id }"
            @click="selectStudent(s)"
          >
            <div class="thumb-avatar">
              <img :src="s.photo ? `data:image/png;base64,${s.photo}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (s.display_name || s.name)" />
            </div>
            <span>{{ (s.display_name || s.name || 'Élève').split(' ')[0] }}</span>
          </div>
        </div>

        <!-- Student Stats Card -->
        <div class="premium-card stats-card ion-padding">
          <div class="student-header">
            <div class="name-tag">
              <h3>{{ studentData.display_name || studentData.full_name || studentData.name || 'Chargement...' }}</h3>
              <p>Classe: {{ studentData.level_id?.[1] || 'Non définie' }}</p>
            </div>
            <div class="attendance-badge">
              <div class="dot"></div>
              <span>En classe</span>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Moyenne</span>
              <span class="stat-value">{{ studentData.average_grade?.toFixed(2) || '0.00' }}<small>/20</small></span>
            </div>
            <div class="divider"></div>
            <div class="stat-item">
              <span class="stat-label">Absences</span>
              <span class="stat-value">--</span>
            </div>
          </div>
        </div>

        <!-- ... Quick Actions Grid ... -->
        <div class="section-header">
          <h2>Actions Rapides</h2>
        </div>

        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="6" class="ion-padding-end">
              <div class="action-tile homework-tile" @click="router.push('/tabs/tab2')">
                <div class="icon-box">
                  <ion-icon :icon="bookOutline"></ion-icon>
                </div>
                <h3>Devoirs</h3>
                <p>À vérifier</p>
              </div>
            </ion-col>
            <ion-col size="6" class="ion-padding-start">
              <div class="action-tile canteen-tile" @click="router.push('/tabs/tab3')">
                <div class="icon-box">
                  <ion-icon :icon="restaurantOutline"></ion-icon>
                </div>
                <h3>Cantine</h3>
                <p>Menu Jour</p>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Fil d'actualité -->
        <div class="section-header">
          <h2>Fil d'actualité</h2>
          <ion-button fill="clear" size="small" @click="router.push('/tabs/tab3')">Voir tout</ion-button>
        </div>

        <div v-if="announcements.length === 0" class="empty-state-card">
          <p>Aucune actualité pour le moment.</p>
        </div>

        <div v-for="ann in announcements" :key="ann.id" class="premium-card news-card">
          <div class="news-header">
            <div class="news-info">
              <h3>{{ ann.title }}</h3>
              <p>{{ formatDatetime(ann.date) }}</p>
            </div>
            <ion-icon :icon="megaphoneOutline" class="news-icon"></ion-icon>
          </div>
          <div class="news-content">
            <p>{{ ann.content }}</p>
          </div>
          <div v-if="ann.attachment" class="attachment-box" @click="downloadAttachment(ann)">
            <ion-icon :icon="documentAttachOutline"></ion-icon>
            <span>{{ ann.attachment_name || 'Pièce jointe' }}</span>
          </div>
        </div>

        <div class="section-header">
          <h2>Derniers Résultats</h2>
          <ion-button fill="clear" size="small" @click="router.push('/tabs/tab2')">Voir tout</ion-button>
        </div>

        <div class="results-list">
          <div v-for="grade in recentGrades" :key="grade.id" class="premium-card grade-item">
            <div class="subject-icon" style="background: rgba(99, 102, 241, 0.1)">
              <ion-icon :icon="calculatorOutline" style="color: #6366f1"></ion-icon>
            </div>
            <div class="grade-info">
              <h4>{{ grade.subject_id?.[1] || 'Évaluation' }}</h4>
              <p>Oral: {{ grade.oral_mark }} | Final: {{ grade.final_mark }}</p>
            </div>
            <div class="grade-pill" :style="{ background: (grade.final_mark >= 10 ? '#10b981' : '#ef4444') }">
              {{ grade.final_mark }}/20
            </div>
          </div>
        </div>
      </div>
      <div v-else class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des données de l'élève...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonButton, IonIcon, IonBadge,
  IonAvatar, IonGrid, IonRow, IonCol, IonSpinner, toastController,
  onIonViewWillEnter
} from '@ionic/vue';
import { notificationsOutline, bookOutline, restaurantOutline, logOutOutline, calculatorOutline, megaphoneOutline, documentAttachOutline, walletOutline, searchOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { onMounted, ref, onUnmounted } from 'vue';

const router = useRouter();
const studentData = ref<any>(null);
const allStudents = ref<any[]>([]);
const recentGrades = ref<any[]>([]);
const announcements = ref<any[]>([]);
const notificationsCount = ref(0);
let syncInterval: any = null;

const handleLogout = () => {
  if (syncInterval) clearInterval(syncInterval);
  odoo.logout();
  router.replace('/login');
};

const showNotification = async (message: string) => {
  const toast = await toastController.create({
    message: message,
    duration: 3000,
    position: 'top',
    color: 'primary',
  });
  await toast.present();
};

const formatDatetime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

const downloadAttachment = (ann: any) => {
  // Simuler le téléchargement
  const link = document.createElement('a');
  link.href = `data:application/octet-stream;base64,${ann.attachment}`;
  link.download = ann.attachment_name || 'piece_jointe';
  link.click();
};

const viewNotifications = async () => {
  const message = notificationsCount.value > 0 
    ? `Vous avez ${notificationsCount.value} nouvelles activités / messages.` 
    : "Aucune nouvelle notification.";
  
  const toast = await toastController.create({
    message: message,
    duration: 3000,
    position: 'top',
    color: 'primary',
    buttons: [
      {
        text: 'Voir Chat',
        handler: () => {
          router.push('/chat');
        }
      }
    ]
  });
  await toast.present();
};

const fetchData = async (isSync = false) => {
  const config = odoo.userConfig;
  if (!config) {
    router.replace('/login');
    return;
  }
  try {
    const students = await apiRequest('/api/school/student', { 
        email: config.email 
      });
    allStudents.value = students;

    if (students && students.length > 0) {
      const selectedId = odoo.selectedStudentId;
      const student = students.find((s: any) => s.id === selectedId) || students[0];
      studentData.value = student;
      
      // Mettre à jour l'ID global si jamais il était nul
      if (!selectedId) odoo.setSelectedStudentId(student.id);

      // Fetch Grades
      recentGrades.value = await apiRequest('/api/school/grades', { 
          student_id: student.id
        });

    const notifs = await odoo.getNotifications(student.id);
      if (isSync && notifs.length > notificationsCount.value) {
        showNotification("Nouvelle activité détectée pour votre enfant !");
      }
      notificationsCount.value = notifs.length;

      // Fetch Announcements
      announcements.value = await odoo.getAnnouncements(student.level_id?.[0]);
    }
  } catch (e: any) {
    console.error('Failed to fetch data', e);
    if (e.message?.includes('401') || e.message?.includes('Not logged in')) {
      handleLogout();
    }
  }
};

const selectStudent = (student: any) => {
  odoo.setSelectedStudentId(student.id);
  fetchData(); 
};

onIonViewWillEnter(() => {
  fetchData();
});

onMounted(() => {
  fetchData();
  // Synchronisation automatique toutes les 60 secondes
  syncInterval = setInterval(() => {
    fetchData(true);
  }, 60000);
});

onUnmounted(() => {
  if (syncInterval) clearInterval(syncInterval);
});
</script>

<style scoped>
.welcome-header {
  margin: 10px 0 30px 0;
}

.welcome-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  color: #1e293b;
}

.gradient-text {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-header p {
  color: #64748b;
  margin: 5px 0 0 0;
  font-size: 1.1rem;
}

.stats-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  margin-bottom: 30px;
}

.child-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  overflow-x: auto;
  padding: 5px 2px;
  scrollbar-width: none;
}

.child-selector::-webkit-scrollbar { display: none; }

.child-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.5;
  transition: all 0.3s;
  min-width: 65px;
}

.child-thumb.active {
  opacity: 1;
  transform: translateY(-2px);
}

.thumb-avatar {
  width: 55px;
  height: 55px;
  border-radius: 18px;
  padding: 3px;
  background: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border: 2px solid transparent;
}

.child-thumb.active .thumb-avatar {
  border-color: #6366f1;
}

.thumb-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
}

.child-thumb span {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.child-thumb.active span {
  color: #6366f1;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}

.name-tag h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.name-tag p {
  margin: 4px 0 0 0;
  opacity: 0.6;
  font-size: 0.9rem;
}

.attendance-badge {
  background: rgba(16, 185, 129, 0.2);
  padding: 6px 12px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.attendance-badge .dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.5;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  margin-top: 2px;
}

.stat-value small {
  font-size: 0.8rem;
  opacity: 0.4;
}

.divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 25px 0 15px 0;
}

.section-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.action-tile {
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s;
}

.action-tile:active { transform: scale(0.96); }

.icon-box {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.homework-tile .icon-box { background: #eff6ff; color: #3b82f6; }
.canteen-tile .icon-box { background: #fff7ed; color: #f59e0b; }
.payment-tile .icon-box { background: #f0fdf4; color: #10b981; }
.lost-tile .icon-box { background: #fdf2f8; color: #db2777; }
.admin-tile { flex-direction: row; align-items: center; background: linear-gradient(90deg, #1e293b, #334155); color: white; }
.admin-tile .icon-box { background: rgba(255, 255, 255, 0.1); color: #8b5cf6; }
.admin-tile h3 { color: white; margin: 0; }
.admin-tile p { color: rgba(255, 255, 255, 0.6); margin: 2px 0 0; }
.admin-label-box { margin-left: 15px; }

.action-tile h3 {
  margin: 5px 0 0 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.action-tile p {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  gap: 15px;
}

.subject-icon {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.grade-info { flex: 1; }
.grade-info h4 { margin: 0; font-size: 1rem; font-weight: 600; }
.grade-info p { margin: 2px 0 0 0; font-size: 0.8rem; color: #94a3b8; }

.grade-pill {
  color: white;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
}

.profile-btn {
  --padding-start: 0;
}

.profile-btn ion-avatar {
  width: 36px;
  height: 36px;
  border: 2px solid var(--ion-color-primary);
}

.empty-state-card {
  background: white;
  padding: 20px;
  border-radius: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.news-card {
  margin-bottom: 20px;
  overflow: hidden;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px 10px;
}

.news-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.news-info p {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.news-icon {
  font-size: 1.4rem;
  color: #6366f1;
  background: #f5f3ff;
  padding: 8px;
  border-radius: 12px;
}

.news-content {
  padding: 0 20px 15px;
}

.news-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
}

.attachment-box {
  background: #f1f5f9;
  margin: 0 20px 15px;
  padding: 10px 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px dashed #cbd5e1;
}

.attachment-box ion-icon {
  font-size: 1.2rem;
  color: #6366f1;
}
</style>
