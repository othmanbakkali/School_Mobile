<template>
  <ion-page>
    <ion-content class="ion-padding selection-bg">
      <div class="header-section fade-in">
        <div class="logo-box">
          <ion-icon :icon="peopleOutline"></ion-icon>
        </div>
        <h1>Vos Enfants</h1>
        <p>Sélectionnez l'élève pour voir ses informations</p>
      </div>

      <div class="students-grid fade-in">
        <div 
          v-for="student in students" 
          :key="student.id" 
          class="student-card premium-card"
          @click="selectStudent(student.id)"
        >
          <div class="avatar-container">
            <img :src="student.photo ? `data:image/png;base64,${student.photo}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.name" />
          </div>
          <div class="info">
            <h3>{{ student.display_name || student.name }}</h3>
            <p>{{ student.level_id?.[1] || 'Classe non définie' }}</p>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="arrow"></ion-icon>
        </div>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div class="logout-footer">
        <ion-button fill="clear" color="medium" @click="handleLogout">
          <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
          Se déconnecter
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonContent, IonIcon, IonSpinner, IonButton 
} from '@ionic/vue';
import { peopleOutline, chevronForwardOutline, logOutOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';

const router = useRouter();
const students = ref<any[]>([]);
const loading = ref(true);

const fetchData = async () => {
  const config = odoo.userConfig;
  if (!config) return;
  
  try {
    const data = await apiRequest('/api/school/student', { email: config.email });
    students.value = data;
    
    // Si un seul enfant, on le sélectionne direct et on va aux tabs
    if (data.length === 1) {
      odoo.setSelectedStudentId(data[0].id);
      router.replace('/tabs/dashboard');
    }
  } catch (e) {
    console.error('Failed to fetch students', e);
  } finally {
    loading.value = false;
  }
};

const selectStudent = (id: number) => {
  odoo.setSelectedStudentId(id);
  router.replace('/tabs/dashboard');
};

const handleLogout = () => {
  odoo.logout();
  router.replace('/login');
};

onMounted(fetchData);
</script>

<style scoped>
.selection-bg {
  --background: #f8fafc;
}

.header-section {
  text-align: center;
  margin: 60px 0 40px;
}

.logo-box {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 2.5rem;
  color: #6366f1;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15);
}

.header-section h1 {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.header-section p {
  color: #64748b;
  margin-top: 8px;
  font-size: 1.1rem;
}

.students-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 10px;
}

.student-card {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
}

.student-card:active {
  transform: scale(0.98);
}

.avatar-container {
  width: 65px;
  height: 65px;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid #f1f5f9;
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
}

.info h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.info p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.arrow {
  color: #cbd5e1;
  font-size: 1.5rem;
}

.logout-footer {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
