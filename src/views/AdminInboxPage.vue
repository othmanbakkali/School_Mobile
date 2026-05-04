<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md" class="admin-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Administration - Boîte de Réception</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar mode="md" class="search-toolbar">
        <ion-searchbar 
          v-model="searchQuery" 
          placeholder="Rechercher un élève..." 
          animated="true"
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
        <p>Aucun message reçu.</p>
      </div>

      <div v-else class="messages-list">
        <!-- Group by student so admin sees one entry per student -->
        <div v-for="student in filteredMessages" :key="student.student_id" 
             class="premium-card message-card" 
             @click="openChat(student.student_id, student.student_name)">
          <div class="card-left">
            <ion-avatar>
              <img :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.student_name" />
            </ion-avatar>
          </div>
          <div class="card-right">
            <div class="card-header">
              <h3>{{ student.student_name }}</h3>
              <span class="time">{{ formatTime(student.latest_date) }}</span>
            </div>
            <p class="parent-name">Dernier msg: {{ student.latest_author }}</p>
            <p class="preview-text">{{ student.latest_body }}</p>
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
import { mailOpenOutline, chevronForwardOutline, logOutOutline } from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { odoo } from '@/services/odoo';
import { useRouter } from 'vue-router';

const router = useRouter();
const messages = ref<any[]>([]);
const allStudents = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');

const fetchMessages = async () => {
  loading.value = true;
  try {
    const [msgRes, studentRes] = await Promise.all([
      odoo.getIncomingMessages(),
      odoo.getAllStudentsForAdmin()
    ]);
    messages.value = msgRes;
    allStudents.value = studentRes;
  } catch (e) {
    console.error('Erreur de chargement des messages admin', e);
  } finally {
    loading.value = false;
  }
};

const groupedMessages = computed(() => {
  const map = new Map();
  // 1. D'abord on met tous les étudiants (sans message)
  allStudents.value.forEach(s => {
    map.set(s.id, {
      student_id: s.id,
      student_name: s.name,
      latest_body: 'Aucun message encore',
      latest_date: null,
      latest_author: null,
      has_history: false
    });
  });

  // 2. Puis on écrase avec les derniers messages réels
  messages.value.forEach(m => {
    map.set(m.student_id, {
      student_id: m.student_id,
      student_name: m.student_name,
      latest_body: m.body,
      latest_date: m.date,
      latest_author: m.author,
      has_history: true
    });
  });
  
  // On trie : ceux avec des messages en premier, puis par date
  return Array.from(map.values()).sort((a, b) => {
    if (a.latest_date && b.latest_date) return new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime();
    if (a.latest_date) return -1;
    if (b.latest_date) return 1;
    return a.student_name.localeCompare(b.student_name);
  });
});

const filteredMessages = computed(() => {
  const grouped = groupedMessages.value;
  if (!searchQuery.value) {
    // Si pas de recherche, on ne montre que ceux qui ont un historique
    return grouped.filter(s => s.has_history);
  }
  const q = searchQuery.value.toLowerCase();
  return grouped.filter(s => s.student_name.toLowerCase().includes(q));
});

const openChat = (studentId: number, studentName: string) => {
  odoo.setSelectedStudentId(studentId);
  router.push({ path: '/admin/chat/' + studentId, query: { name: studentName } });
};

const handleLogout = () => {
  odoo.logout();
  router.replace('/login');
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.admin-toolbar {
  --background: #1e293b;
  --color: white;
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
  gap: 15px;
  padding-top: 10px;
}

.message-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s;
}

.message-card:active {
  transform: scale(0.98);
}

.card-left {
  margin-right: 15px;
}

.card-left ion-avatar {
  width: 55px;
  height: 55px;
  border: 2px solid #e2e8f0;
}

.card-right {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.parent-name {
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  color: #6366f1;
  font-weight: 600;
}

.preview-text {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-action {
  color: #cbd5e1;
  font-size: 1.2rem;
  margin-left: 10px;
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
</style>
