
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
          <ion-button @click="handleLogout" color="medium" aria-label="Se déconnecter">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button color="primary" @click="viewNotifications" aria-label="Voir les notifications">
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
              <div class="action-tile homework-tile" @click="router.push('/tabs/scolarite')">
                <div class="icon-box">
                  <ion-icon :icon="bookOutline"></ion-icon>
                </div>
                <h3>Devoirs</h3>
                <p>À vérifier</p>
              </div>
            </ion-col>
            <ion-col size="6" class="ion-padding-start">
              <div class="action-tile canteen-tile" @click="router.push('/tabs/vie-scolaire')">
                <div class="icon-box">
                  <ion-icon :icon="restaurantOutline"></ion-icon>
                </div>
                <h3>Cantine</h3>
                <p>Menu Jour</p>
              </div>
            </ion-col>
          </ion-row>
          <ion-row class="ion-margin-top">
            <ion-col size="6" class="ion-padding-end">
              <div class="action-tile payment-tile" @click="router.push('/tabs/payments')">
                <div class="icon-box">
                  <ion-icon :icon="walletOutline"></ion-icon>
                </div>
                <h3>Paiements</h3>
                <p>Suivi mensuel</p>
              </div>
            </ion-col>
            <ion-col size="6" class="ion-padding-start">
              <div class="action-tile lost-tile" @click="router.push('/tabs/lost-items')">
                <div class="icon-box">
                  <ion-icon :icon="searchOutline"></ion-icon>
                </div>
                <h3>Objets Perdus</h3>
                <p>Section Trouvés</p>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>


        <!-- Fil d'actualité -->
        <div class="section-header">
          <h2>Fil d'actualité</h2>
          <ion-button fill="clear" size="small" @click="router.push('/tabs/vie-scolaire')">Voir tout</ion-button>
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
          <ion-button fill="clear" size="small" @click="router.push('/tabs/scolarite')">Voir tout</ion-button>
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
/* Glassmorphism & Modern Layout */
.welcome-header {
  margin: 15px 0 25px 0;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.welcome-header h1 {
  font-size: 1.85rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.gradient-text {
  background: linear-gradient(135deg, #5c2d54 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
}

.welcome-header p {
  color: #64748b;
  margin: 6px 0 0 0;
  font-size: 1.05rem;
  font-weight: 500;
}

/* Premium Student Card */
.stats-card {
  background: linear-gradient(135deg, #5c2d54 0%, #3a1934 60%, #210d1e 100%);
  color: white;
  margin-bottom: 25px;
  border-radius: 24px;
  box-shadow: 0 16px 36px -12px rgba(92, 45, 84, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.stats-card::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%);
  border-radius: 50%;
  filter: blur(20px);
  pointer-events: none;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  position: relative;
  z-index: 2;
}

.name-tag h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.3px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.name-tag p {
  margin: 6px 0 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
  font-weight: 600;
}

.attendance-badge {
  background: rgba(16, 185, 129, 0.25);
  border: 1.5px solid rgba(16, 185, 129, 0.4);
  padding: 6px 14px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attendance-badge .dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.72rem;
  opacity: 0.7;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.8px;
}

.stat-value {
  font-size: 1.55rem;
  font-weight: 850;
  margin-top: 4px;
  display: flex;
  align-items: baseline;
}

.stat-value small {
  font-size: 0.9rem;
  opacity: 0.55;
  margin-left: 2px;
}

.divider {
  width: 1px;
  height: 35px;
  background: rgba(255, 255, 255, 0.15);
}

/* Multi-Child Selector */
.child-selector {
  display: flex;
  gap: 16px;
  margin-bottom: 25px;
  overflow-x: auto;
  padding: 8px 4px;
  scrollbar-width: none;
}

.child-selector::-webkit-scrollbar { display: none; }

.child-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.55;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-width: 70px;
  cursor: pointer;
  animation: popIn 0.5s ease-out both;
}

.child-thumb.active {
  opacity: 1;
  transform: translateY(-4px) scale(1.05);
}

.thumb-avatar {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  padding: 3px;
  background: #ffffff;
  box-shadow: 0 8px 16px rgba(0,0,0,0.06);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.child-thumb.active .thumb-avatar {
  border-color: #5c2d54;
  box-shadow: 0 8px 20px rgba(92, 45, 84, 0.2);
}

.thumb-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
}

.child-thumb span {
  font-size: 0.8rem;
  font-weight: 750;
  color: #64748b;
  transition: color 0.3s;
}

.child-thumb.active span {
  color: #5c2d54;
}

/* Action Grid styling with Glassmorphism */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30px 4px 16px 4px;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.4px;
}

.action-tile {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 22px 20px;
  border-radius: 22px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.action-tile:active {
  transform: scale(0.96);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  transition: transform 0.3s;
}

.action-tile:active .icon-box {
  transform: scale(0.9);
}

.homework-tile .icon-box { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.canteen-tile .icon-box { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.payment-tile .icon-box { background: rgba(16, 185, 129, 0.1); color: #059669; }
.lost-tile .icon-box { background: rgba(219, 39, 119, 0.1); color: #db2777; }

.action-tile h3 {
  margin: 4px 0 0 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
}

.action-tile p {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Results & News List */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-item {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  gap: 16px;
  border-radius: 20px;
  background: white;
  border: 1px solid rgba(0,0,0,0.02);
}

.grade-item:active {
  transform: scale(0.98);
}

.subject-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.grade-info { flex: 1; }
.grade-info h4 { margin: 0; font-size: 1.05rem; font-weight: 750; color: #1e293b; }
.grade-info p { margin: 3px 0 0 0; font-size: 0.8rem; color: #64748b; font-weight: 600; }

.grade-pill {
  color: white;
  padding: 8px 14px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.news-card {
  margin-bottom: 20px;
  overflow: hidden;
  border-radius: 22px;
  background: white;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 20px 10px;
}

.news-info h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.news-info p {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 650;
}

.news-icon {
  font-size: 1.4rem;
  color: #5c2d54;
  background: rgba(92, 45, 84, 0.08);
  padding: 10px;
  border-radius: 14px;
}

.news-content {
  padding: 0 20px 18px;
}

.news-content p {
  margin: 0;
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.55;
  font-weight: 500;
}

.attachment-box {
  background: #f8fafc;
  margin: 0 20px 18px;
  padding: 12px 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 750;
  cursor: pointer;
  border: 1px dashed #cbd5e1;
  transition: background-color 0.2s;
}

.attachment-box:active {
  background-color: #f1f5f9;
}

.attachment-box ion-icon {
  font-size: 1.3rem;
  color: #5c2d54;
}

.profile-btn {
  --padding-start: 0;
}

.profile-btn ion-avatar {
  width: 38px;
  height: 38px;
  border: 2px solid #5c2d54;
}

.empty-state-card {
  background: white;
  padding: 25px;
  border-radius: 22px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
}

/* Animations Keyframes */
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
