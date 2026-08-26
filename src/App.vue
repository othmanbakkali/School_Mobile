<template>
  <ion-app>
    <!-- Sidebar Menu -->
    <ion-menu side="start" contentId="main" @ionWillOpen="onMenuOpen">
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

        <!-- Language Switcher Bar -->
        <div class="language-switcher-bar">
          <button 
            class="lang-btn" 
            :class="{ active: locale === 'fr' }" 
            @click="setLocale('fr')">
            🇫🇷 FR
          </button>
          <div class="lang-divider"></div>
          <button 
            class="lang-btn" 
            :class="{ active: locale === 'ar' }" 
            @click="setLocale('ar')">
            🇲🇦 AR
          </button>
        </div>

        <!-- Menu List Content -->
        <div class="menu-items-content">
          <div v-for="item in menuItems" :key="item.label" 
               class="menu-item-row" 
               :class="{ active: isItemActive(item) }" 
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
  cardOutline, 
  cartOutline, 
  swapHorizontalOutline, 
  personOutline, 
  archiveOutline, 
  busOutline,
  calendarOutline,
  alertCircleOutline,
  restaurantOutline,
  ribbonOutline,
  gameControllerOutline,
  trophyOutline
} from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import PWAInstall from '@/components/PWAInstall.vue';
import { useI18n } from '@/services/translationService';

const router = useRouter();
const route = useRoute();

const { t, setLocale, locale } = useI18n();

const studentData = ref<any>(null);
const serverTabs = ref<any[] | null>(null);
const currentRoute = computed(() => route.path);

const iconMap: Record<string, any> = {
  globeOutline,
  calendarOutline,
  documentTextOutline,
  ribbonOutline,
  alertCircleOutline,
  heartOutline,
  schoolOutline,
  bookmarkOutline,
  restaurantOutline,
  busOutline,
  cartOutline,
  swapHorizontalOutline,
  gameControllerOutline,
  trophyOutline,
  cardOutline,
  archiveOutline,
  mailOutline,
  imagesOutline,
  personOutline
};

const codeToI18nKey: Record<string, string> = {
  dashboard: 'menu.dashboard',
  schedule: 'menu.schedule',
  homework: 'menu.homework',
  notes: 'menu.notes',
  absences: 'menu.absences',
  transmission: 'menu.transmission',
  suivi: 'menu.suivi',
  ressources: 'menu.ressources',
  canteen: 'menu.canteen',
  transport: 'menu.transport',
  shop: 'menu.shop',
  wallet: 'menu.wallet',
  games: 'menu.games',
  success: 'menu.success',
  payments: 'menu.payments',
  lostItems: 'menu.lostItems',
  chat: 'menu.chat',
  album: 'menu.album',
  account: 'menu.account'
};

const defaultMenuItems = [
  { code: 'dashboard', label: t('menu.dashboard'), icon: globeOutline, path: '/tabs/dashboard' },
  { code: 'schedule', label: t('menu.schedule'), icon: calendarOutline, path: '/tabs/schedule' },
  { code: 'homework', label: t('menu.homework'), icon: documentTextOutline, path: '/tabs/homework' },
  { code: 'notes', label: t('menu.notes'), icon: ribbonOutline, path: '/tabs/notes' },
  { code: 'absences', label: t('menu.absences'), icon: alertCircleOutline, path: '/tabs/absences' },
  { code: 'transmission', label: t('menu.transmission'), icon: heartOutline, path: '/tabs/transmission' },
  { code: 'suivi', label: t('menu.suivi'), icon: schoolOutline, path: '/tabs/suivi-pedagogique' },
  { code: 'ressources', label: t('menu.ressources'), icon: bookmarkOutline, path: '/tabs/ressources' },
  { code: 'canteen', label: t('menu.canteen'), icon: restaurantOutline, path: '/tabs/vie-scolaire' },
  { code: 'transport', label: t('menu.transport'), icon: busOutline, path: '/tabs/transport' },
  { code: 'shop', label: t('menu.shop'), icon: cartOutline, path: '/tabs/shop' },
  { code: 'wallet', label: t('menu.wallet'), icon: swapHorizontalOutline, path: '/tabs/wallet' },
  { code: 'games', label: t('menu.games'), icon: gameControllerOutline, path: '/tabs/games' },
  { code: 'success', label: t('menu.success'), icon: trophyOutline, path: '/tabs/success' },
  { code: 'payments', label: t('menu.payments'), icon: cardOutline, path: '/tabs/payments' },
  { code: 'lostItems', label: t('menu.lostItems'), icon: archiveOutline, path: '/tabs/lost-items' },
  { code: 'chat', label: t('menu.chat'), icon: mailOutline, path: '/chat' },
  { code: 'album', label: t('menu.album'), icon: imagesOutline, path: '/tabs/album' },
  { code: 'account', label: t('menu.account'), icon: personOutline, path: '/tabs/account' }
];

const isItemActive = (item: any) => {
  const [path, queryStr] = item.path.split('?');
  if (route.path !== path) return false;
  if (!queryStr) return true;
  const params = new URLSearchParams(queryStr);
  for (const [key, value] of params.entries()) {
    if (route.query[key] !== value) return false;
  }
  return true;
};

const studentNameParts = computed(() => {
  if (!studentData.value) return [t('common.loading').toUpperCase()];
  const name = studentData.value.display_name || studentData.value.full_name || studentData.value.name || '';
  return name.toUpperCase().split(' ').filter((p: string) => p.trim() !== '');
});

const studentClass = computed(() => {
  if (!studentData.value || !studentData.value.level_id) return t('common.noData');
  return studentData.value.level_id[1] || t('common.noData');
});

const menuItems = computed(() => {
  if (!serverTabs.value || serverTabs.value.length === 0) {
    return defaultMenuItems;
  }
  return serverTabs.value.map(tab => {
    const code = tab.technical_code;
    const i18nKey = codeToI18nKey[code];
    const label = i18nKey ? t(i18nKey) : tab.name;
    const icon = iconMap[tab.icon] || globeOutline;
    return {
      label,
      icon,
      path: tab.path
    };
  });
});

const fetchMenuConfig = async () => {
  try {
    const tabs = await odoo.getMenuConfig();
    if (Array.isArray(tabs) && tabs.length > 0) {
      serverTabs.value = tabs;
    }
  } catch (e) {
    console.error('App.vue: Erreur lors du chargement des onglets depuis Odoo', e);
  }
};

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

const onMenuOpen = async () => {
  await Promise.all([fetchStudentInfo(), fetchMenuConfig()]);
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
  onMenuOpen();
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

/* Glassmorphic Language Switcher */
.language-switcher-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 15px 20px 5px 20px;
  background: rgba(92, 45, 84, 0.04);
  border: 1px solid rgba(92, 45, 84, 0.12);
  border-radius: 12px;
  padding: 4px;
}

.lang-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #5c2d54;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease-in-out;
}

.lang-btn.active {
  background: #5c2d54;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(92, 45, 84, 0.2);
}

.lang-divider {
  width: 1px;
  height: 16px;
  background: rgba(92, 45, 84, 0.15);
}
</style>
