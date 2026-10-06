<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md" class="admin-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="inbox-title-wrap">
            <span>Administration - Messages</span>
            <span v-if="unreadConversationsCount > 0" class="header-unread-badge">
              {{ unreadConversationsCount }} non lu{{ unreadConversationsCount > 1 ? 's' : '' }}
            </span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="router.push('/tabs/ressources')" title="Ressources Pédagogiques">
            <ion-icon :icon="folderOutline"></ion-icon>
          </ion-button>
          <ion-button @click="fetchMessages(true)" title="Actualiser">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout" title="Déconnexion">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar mode="md" class="search-toolbar">
        <ion-searchbar 
          v-model="searchQuery" 
          placeholder="Rechercher un élève ou parent..." 
          :animated="true"
          class="custom-searchbar"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div v-if="loading" class="ion-text-center ion-padding mt-4">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="text-gray-500 mt-2">Chargement des messages...</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <ion-icon :icon="mailOpenOutline" class="empty-icon"></ion-icon>
        <p>Aucun message reçu pour le moment.</p>
      </div>

      <div v-else class="messages-list">
        <!-- Groupe par élève avec statut Lu / Non Lu et Date intelligente -->
        <div v-for="student in filteredMessages" :key="student.student_id" 
             class="premium-card message-card" 
             :class="{ 'card-unread': isMessageUnread(student) }"
             @click="openChat(student.student_id, student.student_name, student)">
          
          <div class="card-left">
            <div class="avatar-unread-wrapper">
              <ion-avatar>
                <img :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.student_name" />
              </ion-avatar>
              <!-- Pastille rouge pulsante si non lu -->
              <span v-if="isMessageUnread(student)" class="unread-glow-dot"></span>
            </div>
          </div>

          <div class="card-right">
            <div class="card-header">
              <h3 :class="{ 'unread-title': isMessageUnread(student) }">{{ student.student_name }}</h3>
              
              <!-- Date du dernier message avec note ou indication Non lu / Lu -->
              <div class="date-status-box" v-if="student.has_history">
                <span class="time">{{ formatSmartDate(student.latest_date) }}</span>
                <span v-if="isMessageUnread(student)" class="badge-unread">🔴 Non lu</span>
                <span v-else class="badge-read">✓ Lu</span>
              </div>
            </div>

            <div class="message-meta-row" v-if="student.has_history">
              <span class="author-label">
                Dernier message : <strong>{{ student.latest_author }}</strong>
              </span>
              <span v-if="student.is_from_parent" class="role-chip parent">Parent</span>
              <span v-else class="role-chip admin">École</span>
            </div>

            <p class="preview-text" :class="{ 'unread-preview': isMessageUnread(student) }">
              {{ student.latest_body || 'Aucun texte' }}
            </p>
          </div>

          <div class="card-action">
            <ion-icon :icon="chevronForwardOutline"></ion-icon>
          </div>
        </div>
        
        <div v-if="filteredMessages.length === 0" class="empty-state">
          <p>Aucun élève trouvé pour cette recherche.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonAvatar, IonIcon, IonSpinner,
  IonSearchbar, IonButton
} from '@ionic/vue';
import { mailOpenOutline, chevronForwardOutline, logOutOutline, refreshOutline, folderOutline } from 'ionicons/icons';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { odoo } from '@/services/odoo';
import { useRouter } from 'vue-router';
import { notificationService } from '@/services/notificationService';

const router = useRouter();
const messages = ref<any[]>([]);
const allStudents = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
let pollInterval: any = null;

// Helper de conversion sécurisée des dates Odoo (UTC) vers Date locale
const parseUtcDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  let iso = dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
  if (!iso.endsWith('Z') && !iso.includes('+')) {
    iso += 'Z';
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(dateStr) : d;
};

// Gestion du suivi des messages lus par l'administrateur
const getReadTracker = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem('admin_read_messages_map');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

const markStudentAsRead = (studentId: number, latestDate: string | null) => {
  try {
    const tracker = getReadTracker();
    tracker[String(studentId)] = latestDate || new Date().toISOString();
    localStorage.setItem('admin_read_messages_map', JSON.stringify(tracker));
  } catch (e) {}
};

const isMessageUnread = (student: any): boolean => {
  if (!student.has_history || !student.latest_date) return false;
  // Si le dernier message vient de l'école elle-même, la discussion est déjà traitée
  if (!student.is_from_parent) return false;

  const tracker = getReadTracker();
  const lastReadDateStr = tracker[String(student.student_id)];
  if (!lastReadDateStr) return true; // Jamais ouvert

  const latestTime = parseUtcDate(student.latest_date)?.getTime() || 0;
  const lastReadTime = parseUtcDate(lastReadDateStr)?.getTime() || 0;

  return latestTime > lastReadTime;
};

const formatSmartDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = parseUtcDate(dateStr);
  if (!date || isNaN(date.getTime())) return '';
  const now = new Date();
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // Aujourd'hui
  if (date.toDateString() === now.toDateString()) {
    return `Aujourd'hui à ${timeStr}`;
  }

  // Hier
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hier à ${timeStr}`;
  }

  // Cette année
  if (date.getFullYear() === now.getFullYear()) {
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    return `${day} ${month} à ${timeStr}`;
  }

  // Années antérieures
  return `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à ${timeStr}`;
};

const fetchMessages = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const [msgRes, studentRes] = await Promise.all([
      odoo.getIncomingMessages(),
      odoo.getAllStudentsForAdmin()
    ]);

    const prevUnreadCount = unreadConversationsCount.value;
    messages.value = msgRes || [];
    allStudents.value = studentRes || [];

    // Si de nouveaux messages non lus sont arrivés pendant que la page était ouverte
    if (silent && unreadConversationsCount.value > prevUnreadCount) {
      notificationService.showPhoneNotification("💬 Nouveau message reçu !", {
        body: "Un parent a envoyé un nouveau message dans la boîte de réception.",
        url: '/admin/inbox',
        tag: 'admin-inbox-alert'
      });
    }
  } catch (e) {
    console.error('Erreur de chargement des messages admin', e);
  } finally {
    if (!silent) loading.value = false;
  }
};

const groupedMessages = computed(() => {
  const map = new Map();
  // 1. Initialiser tous les étudiants
  allStudents.value.forEach(s => {
    map.set(s.id, {
      student_id: s.id,
      student_name: s.name,
      latest_body: 'Aucun message pour le moment',
      latest_date: null,
      latest_author: null,
      is_from_parent: false,
      last_message_id: null,
      has_history: false
    });
  });

  // 2. Injecter le dernier message émis ou reçu pour chaque élève
  messages.value.forEach(m => {
    if (!m.student_id) return;
    const existing = map.get(m.student_id);

    const mDate = parseUtcDate(m.date);
    const mTime = mDate ? mDate.getTime() : 0;

    const existingDate = existing?.latest_date ? parseUtcDate(existing.latest_date) : null;
    const existingTime = existingDate ? existingDate.getTime() : 0;

    // Conserver impérativement le message le plus récent (qu'il soit émis par l'école ou reçu du parent)
    if (!existing || !existing.has_history || mTime > existingTime) {
      map.set(m.student_id, {
        student_id: m.student_id,
        student_name: m.student_name || existing?.student_name || `Élève #${m.student_id}`,
        latest_body: m.body,
        latest_date: m.date,
        latest_author: m.author,
        is_from_parent: !!m.is_from_parent,
        last_message_id: m.id,
        has_history: true
      });
    }
  });
  
  // 3. Classifier les conversations de la plus récente à la plus ancienne (ordre chronologique décroissant)
  return Array.from(map.values()).sort((a, b) => {
    // Les conversations avec historique passent toujours avant celles sans historique
    if (a.has_history && !b.has_history) return -1;
    if (!a.has_history && b.has_history) return 1;

    const timeA = a.latest_date ? (parseUtcDate(a.latest_date)?.getTime() || 0) : 0;
    const timeB = b.latest_date ? (parseUtcDate(b.latest_date)?.getTime() || 0) : 0;

    if (timeA !== timeB) {
      return timeB - timeA; // Les conversations récentes en premier
    }

    return (a.student_name || '').localeCompare(b.student_name || '');
  });
});

const unreadConversationsCount = computed(() => {
  return groupedMessages.value.filter(s => isMessageUnread(s)).length;
});

const filteredMessages = computed(() => {
  const grouped = groupedMessages.value;
  if (!searchQuery.value) {
    return grouped.filter(s => s.has_history);
  }
  const q = searchQuery.value.toLowerCase();
  return grouped.filter(s => s.student_name.toLowerCase().includes(q));
});

const openChat = (studentId: number, studentName: string, student: any) => {
  markStudentAsRead(studentId, student.latest_date);
  odoo.setSelectedStudentId(studentId);
  router.push({ path: '/admin/chat/' + studentId, query: { name: studentName } });
};

const handleLogout = () => {
  odoo.logout();
  router.replace('/login');
};

onMounted(() => {
  // S'assurer que le mode admin est enregistré pour les notifications Push
  localStorage.setItem('is_admin', 'true');
  if (notificationService.getPermission() === 'granted') {
    notificationService.subscribeToPush(undefined, undefined, true);
  }

  fetchMessages();
  // Polling automatique toutes les 8 secondes pour actualiser les messages reçus en direct
  pollInterval = setInterval(() => fetchMessages(true), 8000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.admin-toolbar {
  --background: #1e293b;
  --color: white;
}

.inbox-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-unread-badge {
  background: #ef4444;
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}

.gray-bg {
  --background: #f8fafc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #94a3b8;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 10px;
  color: #cbd5e1;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 6px;
}

.message-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f1f5f9;
}

/* Style spécifique pour conversation avec message non lu */
.message-card.card-unread {
  background: #ffffff;
  border-left: 5px solid #ef4444;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.12);
}

.message-card:active {
  transform: scale(0.98);
}

.card-left {
  margin-right: 14px;
}

.avatar-unread-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-unread-wrapper ion-avatar {
  width: 52px;
  height: 52px;
  border: 2px solid #e2e8f0;
}

.unread-glow-dot {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #ffffff;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  animation: pulseGlow 1.8s infinite;
}

.card-right {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-header h3.unread-title {
  color: #0f172a;
  font-weight: 800;
}

.date-status-box {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.time {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.badge-unread {
  font-size: 0.7rem;
  font-weight: 800;
  color: #ef4444;
  background: #fee2e2;
  padding: 2px 7px;
  border-radius: 6px;
}

.badge-read {
  font-size: 0.7rem;
  font-weight: 600;
  color: #10b981;
  background: #ecfdf5;
  padding: 2px 6px;
  border-radius: 6px;
}

.message-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.author-label {
  font-size: 0.78rem;
  color: #64748b;
}

.role-chip {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.role-chip.parent {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.role-chip.admin {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.preview-text {
  margin: 0;
  font-size: 0.84rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.preview-text.unread-preview {
  color: #1e293b;
  font-weight: 600;
}

.card-action {
  color: #cbd5e1;
  font-size: 1.2rem;
  margin-left: 8px;
}

.search-toolbar {
  --background: #1e293b;
  padding: 0 10px 10px 10px;
}

.custom-searchbar {
  --background: rgba(255, 255, 255, 0.1);
  --color: white;
  --placeholder-color: #cbd5e1;
  --icon-color: #cbd5e1;
  --border-radius: 12px;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 0;
}

@keyframes pulseGlow {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>
