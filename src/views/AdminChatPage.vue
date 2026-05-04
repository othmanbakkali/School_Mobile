<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md" class="admin-chat-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/inbox"></ion-back-button>
        </ion-buttons>
        <ion-avatar slot="start" class="student-avatar">
          <img :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + studentName" />
        </ion-avatar>
        <ion-title>
          <div class="header-title">
            <span class="name">{{ studentName }}</span>
            <span class="status">Mode Administration</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileUpload" />
          <ion-button @click="triggerFileInput">
            <ion-icon :icon="imagesOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="content" class="chat-bg" :scroll-events="true">
      <div class="messages-container">
        
        <!-- Album Section for Admin -->
        <div v-if="albumPhotos.length > 0" class="admin-album-section">
          <div class="section-header">
            <span>📸 Album de l'élève</span>
            <span class="count">{{ albumPhotos.length }} photos</span>
          </div>
          <div class="album-scroll">
            <div v-for="photo in albumPhotos" :key="photo.id" class="album-item premium-card">
              <img :src="photo.image_url" :alt="photo.name" />
              <div class="photo-delete" @click="deletePhoto(photo.id)">
                <ion-icon :icon="trashOutline"></ion-icon>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="ion-text-center ion-padding">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>
        
        <div v-else-if="messages.length === 0" class="empty-chat">
          <p>Aucun message avec ce parent.</p>
        </div>

        <template v-else>
          <div v-for="(msg, index) in messages" :key="msg.id" 
               class="message-wrapper" 
               :class="{ 'sent': !msg.is_parent, 'received': msg.is_parent }">
            
            <div v-if="shouldShowDate(index)" class="date-divider">
              <span>{{ formatDateDivider(msg.date) }}</span>
            </div>

            <div class="message-bubble">
              <div class="message-text">{{ msg.body }}</div>
              <div class="message-footer">
                <span class="time">{{ formatTime(msg.date) }}</span>
                <ion-icon v-if="!msg.is_parent" :icon="checkmarkDoneOutline" class="read-icon"></ion-icon>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border chat-footer">
      <ion-toolbar>
        <div class="input-container">
          <div class="input-wrapper">
            <ion-textarea
              v-model="newMessage"
              placeholder="Répondre au parent..."
              auto-grow
              :rows="1"
              class="message-input"
              @keypress.enter.prevent="send"
            ></ion-textarea>
          </div>
          <ion-button 
            fill="clear" 
            class="send-btn" 
            :disabled="!newMessage.trim() || sending"
            @click="send"
          >
            <ion-icon :icon="sendSharp"></ion-icon>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonAvatar, IonIcon, IonFooter,
  IonTextarea, IonButton, IonSpinner, toastController, loadingController,
  alertController
} from '@ionic/vue';
import { sendSharp, checkmarkDoneOutline, imagesOutline, trashOutline } from 'ionicons/icons';
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { odoo } from '@/services/odoo';

const route = useRoute();
const studentId = Number(route.params.id);
const studentName = route.query.name || `Élève #${studentId}`;

const messages = ref<any[]>([]);
const albumPhotos = ref<any[]>([]);
const newMessage = ref('');
const loading = ref(true);
const sending = ref(false);
const content = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);
let pollInterval: any = null;

const fetchAlbum = async () => {
  try {
    albumPhotos.value = await odoo.getStudentAlbum(studentId);
  } catch (e) {
    console.error("Erreur chargement album", e);
  }
};

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64Data = reader.result as string;
    
    const loadingCtrl = await loadingController.create({
      message: 'Téléchargement de la photo...',
    });
    await loadingCtrl.present();

    try {
      await odoo.uploadPhotoToAlbum(studentId, file.name, base64Data);
      
      const toast = await toastController.create({
        message: 'Photo ajoutée à l\'album de l\'étudiant !',
        duration: 3000,
        color: 'success',
      });
      await toast.present();
      fetchAlbum(); // Refresh album
    } catch (e: any) {
      console.error(e);
      const toast = await toastController.create({
        message: 'Erreur lors de l\'envoi : ' + e.message,
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      loadingCtrl.dismiss();
      target.value = ''; // Reset input
    }
  };
  reader.readAsDataURL(file);
};

const deletePhoto = async (photoId: number) => {
  const alert = await alertController.create({
    header: 'Supprimer la photo ?',
    message: 'Cette action est irréversible.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          try {
            await odoo.deletePhotoFromAlbum(photoId);
            fetchAlbum(); // Refresh
          } catch (e: any) {
            console.error(e);
          }
        }
      }
    ]
  });
  await alert.present();
};

const fetchData = async (silent = false) => {
  if (!studentId) return;
  
  if (!silent) loading.value = true;
  try {
    const history = await odoo.getChatHistory(studentId);
    messages.value = history;
    if (!silent) scrollToBottom();
  } catch (e) {
    console.error('Chat history error', e);
  } finally {
    if (!silent) loading.value = false;
  }
};

const send = async () => {
  const msg = newMessage.value.trim();
  if (!msg || !studentId || sending.value) return;

  sending.value = true;
  try {
    // Admin uses adminReply endpoint
    await odoo.adminReply(studentId, msg);
    newMessage.value = '';
    await fetchData(true);
    scrollToBottom();
  } catch (e) {
    console.error('Send error', e);
  } finally {
    sending.value = false;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (content.value?.$el) {
      const el = content.value.$el;
      el.scrollToBottom(300);
    }
  });
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const shouldShowDate = (index: number) => {
  if (index === 0) return true;
  const curr = new Date(messages.value[index].date).toDateString();
  const prev = new Date(messages.value[index - 1].date).toDateString();
  return curr !== prev;
};

onMounted(async () => {
  await fetchData();
  fetchAlbum();
  pollInterval = setInterval(() => fetchData(true), 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
/* Admin Album Section */
.admin-album-section {
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  padding: 0 15px 8px;
}

.section-header span {
  font-size: 0.9rem;
  font-weight: 700;
  color: #475569;
}

.section-header .count {
  font-weight: 500;
  color: #94a3b8;
}

.album-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 0 15px 10px;
}

.album-scroll::-webkit-scrollbar { display: none; }

.album-item {
  min-width: 120px;
  max-width: 120px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.album-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  cursor: pointer;
}

.admin-chat-toolbar {
  --background: #1e293b;
  --color: white;
}

.student-avatar {
  width: 38px;
  height: 38px;
  margin-right: 10px;
  border: 2px solid #e2e8f0;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title .name {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.header-title .status {
  font-size: 0.7rem;
  color: #38bdf8;
}

.chat-bg {
  --background: #f8fafc;
}

.messages-container {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message-wrapper.sent {
  align-self: flex-end;
}

.message-wrapper.received {
  align-self: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.sent .message-bubble {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-bottom-right-radius: 4px;
}

.received .message-bubble {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
}

.message-text {
  font-size: 0.95rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.sent .message-text {
  color: #ffffff;
}

.received .message-text {
  color: #1e293b;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.time {
  font-size: 0.65rem;
  font-weight: 500;
}

.sent .time {
  color: rgba(255, 255, 255, 0.6);
}

.received .time {
  color: #64748b;
}

.read-icon {
  font-size: 1rem;
}

.sent .read-icon {
  color: #38bdf8;
}

.date-divider {
  text-align: center;
  margin: 20px 0;
}

.date-divider span {
  background: #f1f5f9;
  color: #475569;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.empty-chat {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.chat-footer {
  background: #ffffff;
  border-top: 1px solid #e5e5e5;
}

.chat-footer ion-toolbar {
  --background: #ffffff;
  --padding-top: 6px;
  --padding-bottom: 6px;
  --padding-start: 10px;
  --padding-end: 10px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
}

.input-wrapper {
  flex: 1;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 0 15px;
  display: flex;
  align-items: center;
}

.message-input {
  --padding-top: 10px;
  --padding-bottom: 10px;
  --color: #050505;
  --placeholder-color: #65676b;
  --placeholder-opacity: 1;
  font-size: 0.95rem;
  margin: 0;
}

.send-btn {
  --padding-start: 0;
  --padding-end: 0;
  margin: 0;
  height: 40px;
  background: transparent;
  box-shadow: none;
  --color: #6366f1;
}

.send-btn ion-icon {
  font-size: 1.6rem;
}
</style>
