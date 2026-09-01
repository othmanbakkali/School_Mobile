<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar" mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
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
          <ion-button color="primary" @click="openNotificationsModal" aria-label="Voir les notifications" class="notif-btn">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <ion-badge v-if="unreadCount > 0" color="danger" class="notif-badge-pill">{{ unreadCount }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Glassmorphic segment tabs -->
      <div class="segment-container" v-if="studentData" style="padding: 0 10px 10px 10px;">
        <ion-segment v-model="selectedSegment" mode="md" class="custom-segment">
          <ion-segment-button value="overview">
            <ion-label>Aperçu Élève</ion-label>
          </ion-segment-button>
          <ion-segment-button value="school-life">
            <ion-label>Vie Scolaire</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
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

        <!-- ==================== TAB 1: OVERVIEW ==================== -->
        <div v-if="selectedSegment === 'overview'" class="fade-in">
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
              <template v-if="isWalletEnabled">
                <div class="divider"></div>
                <div class="stat-item" @click="router.push('/tabs/wallet')" style="cursor: pointer;">
                  <span class="stat-label">Wallet</span>
                  <span class="stat-value">{{ studentData.wallet_balance || '0.00' }}<small> DHS</small></span>
                </div>
              </template>
            </div>
          </div>

          <!-- Customizable Quick Actions Grid -->
          <div class="section-header">
            <h2>Mes Raccourcis</h2>
            <ion-button fill="clear" size="small" class="customize-btn" @click="showShortcutModal = true">
              <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
              Personnaliser
            </ion-button>
          </div>

          <ion-grid class="ion-no-padding">
            <ion-row>
              <ion-col 
                v-for="shortcut in activeShortcuts" 
                :key="shortcut.id" 
                size="6" 
                size-md="3" 
                class="ion-padding-tiny"
              >
                <div class="action-tile" :class="shortcut.colorClass" @click="router.push(shortcut.path)">
                  <div class="icon-box">
                    <ion-icon :icon="shortcut.icon"></ion-icon>
                  </div>
                  <h3>{{ shortcut.title }}</h3>
                  <p>{{ shortcut.subtitle }}</p>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Derniers Résultats -->
          <div class="section-header" style="margin-top: 25px;">
            <h2>Derniers Résultats</h2>
            <ion-button fill="clear" size="small" @click="router.push('/tabs/notes')">Voir tout</ion-button>
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

        <!-- ==================== TAB 2: SCHOOL LIFE ==================== -->
        <div v-else-if="selectedSegment === 'school-life'" class="fade-in">
          <!-- Transport Info Banner Link -->
          <div class="premium-card ion-padding transport-banner" @click="router.push('/tabs/transport')">
            <div class="icon-box transport-icon">
              <ion-icon :icon="busOutline"></ion-icon>
            </div>
            <div class="banner-info">
              <h3>Transport Scolaire</h3>
              <p>Suivre la navette de votre enfant en temps réel</p>
            </div>
            <div class="banner-arrow">→</div>
          </div>

          <!-- Wallet Info Banner Link -->
          <div v-if="isWalletEnabled" class="premium-card ion-padding wallet-banner" @click="router.push('/tabs/wallet')">
            <div class="icon-box wallet-icon">
              <ion-icon :icon="swapHorizontalOutline"></ion-icon>
            </div>
            <div class="banner-info">
              <h3>Portefeuille Étudiant</h3>
              <p>Gérer le solde de la cantine et faire un rechargement</p>
            </div>
            <div class="banner-arrow">→</div>
          </div>

          <!-- Fil d'actualité -->
          <div class="section-header">
            <h2>Actualités de l'École</h2>
            <ion-button fill="clear" size="small" @click="router.push('/tabs/transmission')">Voir dans liaison</ion-button>
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
        </div>
      </div>
      <div v-else class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des données de l'élève...</p>
      </div>

      <!-- Modal de Personnalisation des Raccourcis -->
      <ion-modal :is-open="showShortcutModal" @didDismiss="showShortcutModal = false" class="shortcut-modal">
        <ion-header>
          <ion-toolbar mode="md">
            <ion-title>Personnaliser mes raccourcis</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showShortcutModal = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <p class="modal-desc">Sélectionnez les accès rapides à afficher sur votre tableau de bord :</p>

          <ion-list lines="full" class="shortcut-selection-list">
            <ion-item 
              v-for="item in availableShortcutsList" 
              :key="item.id" 
              button 
              @click="toggleShortcut(item.id)"
              class="shortcut-item"
            >
              <div class="modal-shortcut-icon" :class="item.colorClass" slot="start">
                <ion-icon :icon="item.icon"></ion-icon>
              </div>
              <ion-label>
                <h2>{{ item.title }}</h2>
                <p>{{ item.subtitle }}</p>
              </ion-label>
              <ion-checkbox 
                slot="end" 
                :checked="isShortcutSelected(item.id)"
                @click.stop="toggleShortcut(item.id)"
              ></ion-checkbox>
            </ion-item>
          </ion-list>

          <div class="modal-actions ion-margin-top">
            <ion-button expand="block" color="primary" class="save-shortcuts-btn" @click="saveShortcuts">
              Enregistrer mes choix
            </ion-button>
            <ion-button expand="block" fill="clear" color="medium" @click="resetDefaultShortcuts">
              Réinitialiser par défaut
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Modal Centre de Notifications -->
      <ion-modal :is-open="showNotifModal" @didDismiss="showNotifModal = false" class="custom-modal notif-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar class="transparent-toolbar" mode="md">
            <ion-title>Notifications</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showNotifModal = false" color="medium">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding notif-modal-content">
          <div class="notif-top-bar" v-if="allNotifications.length > 0">
            <div class="notif-summary-pill">
              <span class="unread-chip" v-if="unreadCount > 0">{{ unreadCount }} non lue{{ unreadCount > 1 ? 's' : '' }}</span>
              <span class="all-read-chip" v-else>Toutes lues ✓</span>
            </div>
            <ion-button v-if="unreadCount > 0" size="small" fill="clear" color="primary" class="mark-all-btn" @click="markAllAsRead">
              <ion-icon :icon="checkmarkDoneOutline" slot="start"></ion-icon>
              Tout marquer comme lu
            </ion-button>
          </div>

          <!-- État vide si aucune notification -->
          <div v-if="allNotifications.length === 0" class="empty-notif-box">
            <div class="empty-notif-icon-circle">
              <ion-icon :icon="notificationsOffOutline"></ion-icon>
            </div>
            <h3>Aucune notification</h3>
            <p>Aucune nouvelle activité, nouvel exercice ou message pour le moment.</p>
          </div>

          <!-- Liste des notifications -->
          <div v-else class="notif-cards-container">
            <div 
              v-for="item in allNotifications" 
              :key="item.id" 
              class="notif-entry-card" 
              :class="{ 'is-unread': !isNotifRead(item.id) }"
              @click="handleNotificationClick(item)"
            >
              <div class="notif-type-icon" :class="item.type">
                <ion-icon :icon="getNotifIcon(item.type)"></ion-icon>
              </div>
              
              <div class="notif-entry-details">
                <div class="notif-entry-header">
                  <span class="notif-type-badge" :class="item.type">{{ getNotifTypeLabel(item.type) }}</span>
                  <span class="notif-entry-time">{{ formatTimeAgo(item.date) }}</span>
                </div>
                <h4 class="notif-entry-title">{{ item.title }}</h4>
                <p class="notif-entry-desc">{{ item.description }}</p>
              </div>

              <div class="notif-entry-action">
                <div class="unread-indicator" v-if="!isNotifRead(item.id)" title="Non lu"></div>
                <ion-icon :icon="chevronForwardOutline" class="chevron-icon"></ion-icon>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonButton, IonIcon, IonBadge, IonMenuButton,
  IonAvatar, IonGrid, IonRow, IonCol, IonSpinner, toastController,
  IonSegment, IonSegmentButton, IonLabel,
  IonModal, IonList, IonItem, IonCheckbox,
  onIonViewWillEnter
} from '@ionic/vue';
import { 
  notificationsOutline, notificationsOffOutline, checkmarkDoneOutline, chevronForwardOutline,
  bookOutline, restaurantOutline, logOutOutline, 
  calculatorOutline, megaphoneOutline, documentAttachOutline, walletOutline, 
  searchOutline, busOutline, swapHorizontalOutline, settingsOutline, closeOutline,
  journalOutline, calendarClearOutline, timeOutline, chatbubblesOutline,
  cartOutline, trophyOutline, gameControllerOutline, folderOpenOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { onMounted, ref, computed, onUnmounted } from 'vue';

const router = useRouter();
const selectedSegment = ref('overview');
const studentData = ref<any>(null);
const allStudents = ref<any[]>([]);
const recentGrades = ref<any[]>([]);
const announcements = ref<any[]>([]);
const allNotifications = ref<any[]>([]);
const readNotifIds = ref<string[]>([]);
const showNotifModal = ref(false);

const unreadCount = computed(() => {
  return allNotifications.value.filter(n => !readNotifIds.value.includes(n.id)).length;
});

let syncInterval: any = null;

// Catalog of all available shortcuts
const ALL_SHORTCUTS = [
  { id: 'homework', title: 'Devoirs', subtitle: 'À vérifier', path: '/tabs/homework', icon: bookOutline, colorClass: 'homework-tile' },
  { id: 'transmission', title: 'Transmission', subtitle: 'Cahier de liaison', path: '/tabs/transmission', icon: journalOutline, colorClass: 'transmission-tile' },
  { id: 'canteen', title: 'Cantine', subtitle: 'Menu du Jour', path: '/tabs/vie-scolaire', icon: restaurantOutline, colorClass: 'canteen-tile' },
  { id: 'payments', title: 'Paiements', subtitle: 'Suivi mensuel', path: '/tabs/payments', icon: walletOutline, colorClass: 'payment-tile' },
  { id: 'absences', title: 'Absences', subtitle: 'Retards & Motifs', path: '/tabs/absences', icon: calendarClearOutline, colorClass: 'absences-tile' },
  { id: 'notes', title: 'Notes', subtitle: 'Évaluations', path: '/tabs/notes', icon: calculatorOutline, colorClass: 'notes-tile' },
  { id: 'schedule', title: 'Emploi du temps', subtitle: 'Planning des cours', path: '/tabs/schedule', icon: timeOutline, colorClass: 'schedule-tile' },
  { id: 'transport', title: 'Transport', subtitle: 'Navette en direct', path: '/tabs/transport', icon: busOutline, colorClass: 'transport-tile' },
  { id: 'wallet', title: 'Portefeuille', subtitle: 'Solde & Recharge', path: '/tabs/wallet', icon: swapHorizontalOutline, colorClass: 'wallet-tile' },
  { id: 'lost-items', title: 'Objets Perdus', subtitle: 'Section Trouvés', path: '/tabs/lost-items', icon: searchOutline, colorClass: 'lost-tile' },
  { id: 'chat', title: 'Messagerie', subtitle: 'Discussion Directe', path: '/chat', icon: chatbubblesOutline, colorClass: 'chat-tile' },
  { id: 'shop', title: 'Boutique', subtitle: 'Fournitures & Uniformes', path: '/tabs/shop', icon: cartOutline, colorClass: 'shop-tile' },
  { id: 'success-hub', title: 'Success Hub', subtitle: 'Badges & Mérites', path: '/tabs/success-hub', icon: trophyOutline, colorClass: 'success-tile' },
  { id: 'serious-games', title: 'Jeux Éducatifs', subtitle: 'Quiz & Défis', path: '/tabs/serious-games', icon: gameControllerOutline, colorClass: 'games-tile' },
  { id: 'ressources', title: 'Ressources', subtitle: 'Documents & Cours', path: '/tabs/ressources', icon: folderOpenOutline, colorClass: 'ressources-tile' },
];

const DEFAULT_SHORTCUT_IDS = ['homework', 'transmission', 'canteen', 'payments', 'notes', 'transport'];
const userShortcutIds = ref<string[]>([]);
const showShortcutModal = ref(false);
const serverTabs = ref<any[]>([]);

const isWalletEnabled = computed(() => {
  if (!studentData.value) return false;
  
  if (studentData.value.wallet_enabled === false || 
      studentData.value.has_wallet === false || 
      studentData.value.use_wallet === false || 
      studentData.value.wallet_disabled === true) {
    return false;
  }

  if (studentData.value.wallet_balance === false || 
      studentData.value.wallet_balance === null || 
      studentData.value.wallet_balance === undefined) {
    return false;
  }

  if (Array.isArray(serverTabs.value) && serverTabs.value.length > 0) {
    const walletTab = serverTabs.value.find((t: any) => t.technical_code === 'wallet');
    if (!walletTab || walletTab.is_active === false) {
      return false;
    }
  }

  return true;
});

const loadSavedShortcuts = () => {
  try {
    const saved = localStorage.getItem('user_dashboard_shortcuts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userShortcutIds.value = parsed;
        return;
      }
    }
  } catch (e) {
    console.error('Failed to load saved shortcuts', e);
  }
  userShortcutIds.value = [...DEFAULT_SHORTCUT_IDS];
};

const activeShortcuts = computed(() => {
  return ALL_SHORTCUTS.filter(s => {
    if (s.id === 'wallet' && !isWalletEnabled.value) return false;
    return userShortcutIds.value.includes(s.id);
  });
});

const availableShortcutsList = computed(() => {
  return ALL_SHORTCUTS.filter(s => {
    if (s.id === 'wallet' && !isWalletEnabled.value) return false;
    return true;
  });
});

const isShortcutSelected = (id: string) => {
  return userShortcutIds.value.includes(id);
};

const toggleShortcut = (id: string) => {
  const index = userShortcutIds.value.indexOf(id);
  if (index > -1) {
    if (userShortcutIds.value.length > 1) {
      userShortcutIds.value.splice(index, 1);
    }
  } else {
    userShortcutIds.value.push(id);
  }
};

const saveShortcuts = async () => {
  localStorage.setItem('user_dashboard_shortcuts', JSON.stringify(userShortcutIds.value));
  showShortcutModal.value = false;
  const toast = await toastController.create({
    message: 'Vos raccourcis ont été mis à jour avec succès !',
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  await toast.present();
};

const resetDefaultShortcuts = () => {
  userShortcutIds.value = [...DEFAULT_SHORTCUT_IDS];
  saveShortcuts();
};

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
  const link = document.createElement('a');
  link.href = `data:application/octet-stream;base64,${ann.attachment}`;
  link.download = ann.attachment_name || 'piece_jointe';
  link.click();
};

const loadReadNotifIds = (studentId: number) => {
  try {
    const key = `read_notifs_${studentId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      readNotifIds.value = JSON.parse(saved);
    } else {
      readNotifIds.value = [];
    }
  } catch (e) {
    readNotifIds.value = [];
  }
};

const isNotifRead = (id: string) => {
  return readNotifIds.value.includes(id);
};

const markNotifAsRead = (notifId: string) => {
  if (!readNotifIds.value.includes(notifId)) {
    readNotifIds.value.push(notifId);
    if (studentData.value?.id) {
      localStorage.setItem(`read_notifs_${studentData.value.id}`, JSON.stringify(readNotifIds.value));
    }
  }
};

const markAllAsRead = () => {
  for (const n of allNotifications.value) {
    if (!readNotifIds.value.includes(n.id)) {
      readNotifIds.value.push(n.id);
    }
  }
  if (studentData.value?.id) {
    localStorage.setItem(`read_notifs_${studentData.value.id}`, JSON.stringify(readNotifIds.value));
  }
};

const handleNotificationClick = (notif: any) => {
  markNotifAsRead(notif.id);
  showNotifModal.value = false;
  if (notif.link) {
    router.push(notif.link);
  }
};

const openNotificationsModal = () => {
  showNotifModal.value = true;
};

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'homework': return bookOutline;
    case 'activity': return megaphoneOutline;
    case 'transmission': return journalOutline;
    case 'message': return chatbubblesOutline;
    default: return notificationsOutline;
  }
};

const getNotifTypeLabel = (type: string) => {
  switch (type) {
    case 'homework': return 'Exercice';
    case 'activity': return 'Activité';
    case 'transmission': return 'Liaison';
    case 'message': return 'Message';
    default: return 'Information';
  }
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (isNaN(d.getTime())) return '';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const fetchData = async (isSync = false) => {
  const config = odoo.userConfig;
  if (!config) {
    router.replace('/login');
    return;
  }
  try {
    try {
      const menuConfig = await odoo.getMenuConfig();
      if (Array.isArray(menuConfig)) {
        serverTabs.value = menuConfig;
      }
    } catch (menuErr) {
      console.warn('Failed to load menu config on dashboard', menuErr);
    }

    const students = await apiRequest('/api/school/student', { 
        email: config.email 
      });
    allStudents.value = students;

    if (students && students.length > 0) {
      const selectedId = odoo.selectedStudentId;
      const student = students.find((s: any) => s.id === selectedId) || students[0];
      studentData.value = student;
      
      if (!selectedId) odoo.setSelectedStudentId(student.id);

      loadReadNotifIds(student.id);

      // Fetch Grades
      recentGrades.value = await apiRequest('/api/school/grades', { 
          student_id: student.id
        });

      // Fetch unified Notifications (devoirs, activités, messages)
      const notifs = await odoo.getNotifications(student.id, student.level_id?.[0]);
      if (Array.isArray(notifs)) {
        const prevUnread = unreadCount.value;
        allNotifications.value = notifs;
        const newUnread = notifs.filter((n: any) => !readNotifIds.value.includes(n.id)).length;
        if (isSync && newUnread > prevUnread) {
          showNotification("Nouvelle notification de l'école reçue !");
        }
      }

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
  loadSavedShortcuts();
  fetchData();
});

onMounted(() => {
  loadSavedShortcuts();
  fetchData();
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

.customize-btn {
  --color: #5c2d54;
  font-weight: 750;
  font-size: 0.85rem;
}

.ion-padding-tiny {
  padding: 6px;
}

.action-tile {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 18px 16px;
  border-radius: 20px;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-tile:active {
  transform: scale(0.96);
  background: rgba(255, 255, 255, 0.95);
}

.icon-box {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.homework-tile .icon-box { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.transmission-tile .icon-box { background: rgba(92, 45, 84, 0.1); color: #5c2d54; }
.canteen-tile .icon-box { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.payment-tile .icon-box { background: rgba(16, 185, 129, 0.1); color: #059669; }
.absences-tile .icon-box { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.notes-tile .icon-box { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.schedule-tile .icon-box { background: rgba(14, 165, 233, 0.1); color: #0284c7; }
.transport-tile .icon-box { background: rgba(217, 119, 6, 0.1); color: #d97706; }
.wallet-tile .icon-box { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.lost-tile .icon-box { background: rgba(219, 39, 119, 0.1); color: #db2777; }
.chat-tile .icon-box { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.shop-tile .icon-box { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
.success-tile .icon-box { background: rgba(234, 179, 8, 0.1); color: #eab308; }
.games-tile .icon-box { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.ressources-tile .icon-box { background: rgba(100, 116, 139, 0.1); color: #64748b; }

.action-tile h3 {
  margin: 2px 0 0 0;
  font-size: 0.98rem;
  font-weight: 800;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-tile p {
  margin: 0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Modal Customization Styling */
.shortcut-modal {
  --border-radius: 24px;
}

.modal-desc {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.shortcut-selection-list {
  background: transparent;
}

.shortcut-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
  border-radius: 14px;
}

.modal-shortcut-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin-right: 12px;
}

.save-shortcuts-btn {
  --background: #5c2d54;
  font-weight: 750;
  --border-radius: 14px;
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

/* Full-width Banners (Transport & Wallet) */
.transport-banner, .wallet-banner {
  cursor: pointer;
  display: flex;
  flex-direction: row !important;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 22px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
}

.transport-banner {
  border-left: 5px solid #d97706;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, rgba(245, 158, 11, 0.06) 100%);
}

.wallet-banner {
  border-left: 5px solid #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.06) 100%);
  margin-bottom: 25px;
}

.transport-banner:active, .wallet-banner:active {
  transform: scale(0.97);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.transport-icon {
  background: #fffbeb;
  color: #d97706;
  padding: 10px;
  border-radius: 12px;
  font-size: 1.5rem;
  display: flex;
}

.wallet-icon {
  background: #f5f3ff;
  color: #8b5cf6;
  padding: 10px;
  border-radius: 12px;
  font-size: 1.5rem;
  display: flex;
}

.banner-info {
  flex: 1;
}

.banner-info h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e293b;
}

.banner-info p {
  margin: 3px 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.banner-arrow {
  color: #cbd5e1;
  font-weight: 800;
  font-size: 1.1rem;
  transition: transform 0.2s ease;
}

.transport-banner:active .banner-arrow,
.wallet-banner:active .banner-arrow {
  transform: translateX(4px);
}

/* ========================================================
   NOTIFICATION CENTER MODAL & BADGES
   ======================================================== */
.notif-btn {
  position: relative;
}

.notif-badge-pill {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  animation: pulse-badge 2s infinite ease-in-out;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.notif-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.unread-chip {
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.all-read-chip {
  background: #ecfdf5;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.mark-all-btn {
  font-size: 0.8rem;
  font-weight: 700;
  --color: #3b82f6;
}

.empty-notif-box {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-notif-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 16px auto;
}

.empty-notif-box h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 8px 0;
}

.empty-notif-box p {
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
}

.notif-cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notif-entry-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
}

.notif-entry-card:active {
  transform: scale(0.98);
}

.notif-entry-card.is-unread {
  background: #f8faff;
  border-color: #dbeafe;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.08);
}

.notif-type-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.notif-type-icon.homework {
  background: #eff6ff;
  color: #2563eb;
}

.notif-type-icon.activity {
  background: #ecfdf5;
  color: #059669;
}

.notif-type-icon.transmission {
  background: #fffbeb;
  color: #d97706;
}

.notif-type-icon.message {
  background: #faf5ff;
  color: #9333ea;
}

.notif-entry-details {
  flex: 1;
  min-width: 0;
}

.notif-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notif-type-badge {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 6px;
}

.notif-type-badge.homework {
  background: #dbeafe;
  color: #1e40af;
}

.notif-type-badge.activity {
  background: #d1fae5;
  color: #065f46;
}

.notif-type-badge.transmission {
  background: #fef3c7;
  color: #92400e;
}

.notif-type-badge.message {
  background: #f3e8ff;
  color: #6b21a8;
}

.notif-entry-time {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
}

.notif-entry-title {
  margin: 0 0 3px 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.notif-entry-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
}

.notif-entry-action {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: center;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
}

.chevron-icon {
  color: #cbd5e1;
  font-size: 1rem;
}
</style>
