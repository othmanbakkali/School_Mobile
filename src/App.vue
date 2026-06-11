<template>
  <ion-app>
    <!-- Sidebar Menu -->
    <ion-menu side="start" contentId="main" @ionWillOpen="fetchStudentInfo">
      <div class="menu-container">
        <!-- Premium Header Area -->
        <div class="menu-profile-header">
          <div class="header-content-row" v-if="studentData">
            <!-- Student Avatar with status dot -->
            <div class="avatar-container">
              <img :src="studentData.photo ? `data:image/png;base64,${studentData.photo}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + studentData.name" class="student-avatar" />
              <div class="status-dot-active"></div>
            </div>
            
            <!-- Vertical Divider -->
            <div class="vertical-divider"></div>
            
            <!-- Student Name and Class -->
            <div class="profile-info">
              <div class="student-name-box">
                <span class="name-part" v-for="(part, idx) in studentNameParts" :key="idx">{{ part }}</span>
              </div>
              <span class="student-class">{{ studentClass }}</span>
            </div>
          </div>
          <div class="header-content-row loading-header" v-else>
            <ion-spinner name="crescent" color="light"></ion-spinner>
          </div>
        </div>

        <!-- Menu List Content -->
        <div class="menu-items-content">
          <div v-for="item in menuItems" :key="item.label" 
               class="menu-item-row" 
               :class="{ active: currentRoute === item.path || (item.path === '/tabs/tab2' && currentRoute.includes('tab2')) }" 
               @click="handleItemClick(item)">
            <ion-icon :icon="item.icon" class="menu-item-icon"></ion-icon>
            <span class="menu-item-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </ion-menu>

    <!-- Main Content -->
    <ion-router-outlet id="main" />
    <PWAInstall />
  </ion-app>
</template>

<script setup lang="ts">
import { 
  IonApp, 
  IonRouterOutlet, 
  IonMenu, 
  IonIcon, 
  IonSpinner,
  toastController 
} from '@ionic/vue';
import { 
  globeOutline, 
  heartOutline, 
  documentTextOutline, 
  schoolOutline, 
  bookmarkOutline, 
  mailOutline, 
  imagesOutline, 
  createOutline, 
  cardOutline, 
  cartOutline, 
  swapHorizontalOutline, 
  personOutline, 
  archiveOutline, 
  informationCircleOutline 
} from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import PWAInstall from '@/components/PWAInstall.vue';

const router = useRouter();
const route = useRoute();

const studentData = ref<any>(null);
const currentRoute = computed(() => route.path);

const studentNameParts = computed(() => {
  if (!studentData.value) return ['CHARGEMENT...'];
  const name = studentData.value.display_name || studentData.value.full_name || studentData.value.name || '';
  return name.toUpperCase().split(' ').filter((p: string) => p.trim() !== '');
});

const studentClass = computed(() => {
  if (!studentData.value || !studentData.value.level_id) return 'Non assignée';
  return studentData.value.level_id[1] || 'Non assignée';
});

const menuItems = [
  { label: 'Nouveautés', icon: globeOutline, path: '/tabs/tab1' },
  { label: 'Cahier de transmission', icon: heartOutline, path: '/tabs/transmission' },
  { label: 'Devoirs', icon: documentTextOutline, path: '/tabs/tab2' },
  { label: 'Suivi pédagogique', icon: schoolOutline, path: '/tabs/suivi-pedagogique' },
  { label: 'Ressources', icon: bookmarkOutline, path: '/tabs/ressources' },
  { label: 'Messages', icon: mailOutline, path: '/chat' },
  { label: 'Album Photo', icon: imagesOutline, path: '/tabs/tab4' },
  { label: 'Mes demandes', icon: createOutline, path: '/tabs/tab3' },
  { label: 'État des paiements', icon: cardOutline, path: '/tabs/payments' },
  { label: 'Boutique de l\'école', icon: cartOutline, path: 'placeholder_boutique' },
  { label: 'Student wallet', icon: swapHorizontalOutline, path: 'placeholder_wallet' },
  { label: 'Mon compte', icon: personOutline, path: 'placeholder_account' },
  { label: 'Objets perdus', icon: archiveOutline, path: '/tabs/lost-items' },
  { label: 'Contact', icon: informationCircleOutline, path: '/tabs/tab3' }
];

const fetchStudentInfo = async () => {
  const config = odoo.userConfig;
  if (!config) return;
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    if (students && students.length > 0) {
      const selectedId = odoo.selectedStudentId;
      const student = students.find((s: any) => s.id === selectedId) || students[0];
      studentData.value = student;
    }
  } catch (e) {
    console.error('App.vue: Failed to fetch student info', e);
  }
};

async function handleItemClick(item: any) {
  const menu = document.querySelector('ion-menu');
  if (menu) await menu.close();

  if (item.path.startsWith('placeholder_')) {
    const toast = await toastController.create({
      message: 'Fonctionnalité bientôt disponible !',
      duration: 2000,
      color: 'medium',
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  } else {
    router.push(item.path);
  }
}

onMounted(() => {
  fetchStudentInfo();
});
</script>

<style>
/* Global Menu Styles */
.menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

/* Premium Violet Header */
.menu-profile-header {
  background: #5c2d54; /* Eggplant purple background */
  padding: 40px 20px 25px 20px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  color: #ffffff;
}

.header-content-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-header {
  justify-content: center;
  padding: 10px 0;
}

/* Avatar setup */
.avatar-container {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
}

.student-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.status-dot-active {
  position: absolute;
  bottom: 0px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4cd964; /* Active green pastille */
  border: 2px solid #5c2d54;
  box-shadow: 0 0 6px rgba(76, 217, 100, 0.5);
}

/* Vertical Divider */
.vertical-divider {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

/* Profile Name & Class */
.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.student-name-box {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  margin-bottom: 4px;
}

.name-part {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #ffffff;
}

.student-class {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.5px;
}

/* Menu Items List */
.menu-items-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.menu-item-row {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  gap: 18px;
  color: #4a4a4a;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.menu-item-row:active {
  background: rgba(92, 45, 84, 0.05);
}

.menu-item-icon {
  font-size: 1.45rem;
  color: #5c2d54; /* Match eggplant color */
  transition: transform 0.2s ease;
}

.menu-item-row:hover .menu-item-icon {
  transform: scale(1.1);
}

.menu-item-label {
  font-size: 0.95rem;
  font-weight: 500;
}

/* Active State Styling */
.menu-item-row.active {
  color: #5c2d54;
  background: rgba(92, 45, 84, 0.05);
}

.menu-item-row.active .menu-item-label {
  font-weight: 700; /* Bold as in the screenshot */
}

/* Custom Toast styling */
.custom-toast {
  --background: #5c2d54;
  --color: #ffffff;
  font-weight: 600;
}
</style>
