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
              <!-- Pièces jointes du message -->
              <div v-if="msg.attachments && msg.attachments.length > 0" class="msg-attachments-container">
                <div v-for="att in msg.attachments" :key="att.id" class="attachment-item">
                  <!-- Cas d'une image -->
                  <div v-if="isImage(att.mimetype, att.name)" class="attached-image-wrapper" @click="downloadOrOpen(att)">
                    <img :src="att.url" :alt="att.name" class="attached-image-preview" />
                    <div class="image-overlay">
                      <ion-icon :icon="downloadOutline"></ion-icon>
                    </div>
                  </div>

                  <!-- Cas d'un document -->
                  <div v-else class="attached-file-box" @click="downloadOrOpen(att)">
                    <div class="file-icon-box" :class="getFileTypeClass(att.name)">
                      <ion-icon :icon="getFileIcon(att.mimetype, att.name)"></ion-icon>
                    </div>
                    <div class="file-details">
                      <span class="file-name" :title="att.name">{{ att.name }}</span>
                      <span class="file-size" v-if="att.size">{{ formatFileSize(att.size) }}</span>
                    </div>
                    <ion-icon :icon="downloadOutline" class="file-download-icon"></ion-icon>
                  </div>
                </div>
              </div>

              <div v-if="msg.body" class="message-text">{{ msg.body }}</div>
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
      <!-- Aperçu de la pièce jointe avant envoi -->
      <div v-if="selectedAttachment" class="attachment-preview-bar">
        <div class="preview-content">
          <img v-if="isImage(selectedAttachment.mimetype, selectedAttachment.filename)" :src="selectedAttachment.filedata" class="preview-thumb" />
          <div v-else class="preview-file-icon">
            <ion-icon :icon="getFileIcon(selectedAttachment.mimetype, selectedAttachment.filename)"></ion-icon>
          </div>
          <div class="preview-info">
            <span class="preview-filename">{{ selectedAttachment.filename }}</span>
            <span class="preview-filesize">{{ formatFileSize(selectedAttachment.size) }}</span>
          </div>
        </div>
        <ion-button fill="clear" color="medium" size="small" class="remove-att-btn" @click="removeAttachment">
          <ion-icon :icon="closeCircleOutline"></ion-icon>
        </ion-button>
      </div>

      <ion-toolbar>
        <div class="input-container">
          <input 
            type="file" 
            ref="chatFileInputRef" 
            style="display: none" 
            @change="handleChatFileSelected" 
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          <ion-button fill="clear" color="primary" class="attach-btn" @click="triggerChatFileInput" title="Joindre un fichier">
            <ion-icon :icon="attachOutline"></ion-icon>
          </ion-button>

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
            :disabled="(!newMessage.trim() && !selectedAttachment) || sending"
            @click="send"
          >
            <ion-spinner v-if="sending" name="dots" color="primary"></ion-spinner>
            <ion-icon v-else :icon="sendSharp"></ion-icon>
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
import { 
  sendSharp, checkmarkDoneOutline, imagesOutline, trashOutline, 
  attachOutline, closeCircleOutline, documentAttachOutline, 
  documentTextOutline, imageOutline, downloadOutline 
} from 'ionicons/icons';
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
const chatFileInputRef = ref<HTMLInputElement | null>(null);
const selectedAttachment = ref<{ filename: string, filedata: string, mimetype: string, size: number } | null>(null);
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

const triggerChatFileInput = () => {
  if (chatFileInputRef.value) {
    chatFileInputRef.value.value = '';
    chatFileInputRef.value.click();
  }
};

const handleChatFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 15 * 1024 * 1024) {
    toastController.create({
      message: 'Fichier trop volumineux (Max 15 Mo).',
      duration: 3000,
      color: 'danger'
    }).then(t => t.present());
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedAttachment.value = {
      filename: file.name,
      filedata: reader.result as string,
      mimetype: file.type || 'application/octet-stream',
      size: file.size
    };
  };
  reader.readAsDataURL(file);
};

const removeAttachment = () => {
  selectedAttachment.value = null;
  if (chatFileInputRef.value) chatFileInputRef.value.value = '';
};

const isImage = (mimetype?: string, name?: string) => {
  if (mimetype && mimetype.startsWith('image/')) return true;
  if (name && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) return true;
  return false;
};

const getFileIcon = (mimetype?: string, name?: string) => {
  if (isImage(mimetype, name)) return imageOutline;
  if (name && /\.pdf$/i.test(name)) return documentTextOutline;
  return documentAttachOutline;
};

const getFileTypeClass = (name?: string) => {
  if (name && /\.pdf$/i.test(name)) return 'type-pdf';
  if (name && /\.(doc|docx)$/i.test(name)) return 'type-doc';
  if (name && /\.(xls|xlsx)$/i.test(name)) return 'type-xls';
  return 'type-generic';
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const downloadOrOpen = (att: any) => {
  if (!att.url) return;
  const link = document.createElement('a');
  link.href = att.url;
  link.download = att.name || 'piece_jointe';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const send = async () => {
  const msg = newMessage.value.trim();
  const att = selectedAttachment.value;
  if ((!msg && !att) || !studentId || sending.value) return;

  sending.value = true;
  try {
    await odoo.adminReply(studentId, msg, att ? {
      filename: att.filename,
      filedata: att.filedata,
      mimetype: att.mimetype
    } : undefined);
    
    newMessage.value = '';
    selectedAttachment.value = null;
    await fetchData(true);
    scrollToBottom();
  } catch (e: any) {
    console.error('Send error', e);
    const toast = await toastController.create({
      message: 'Erreur envoi: ' + (e.message || 'Échec'),
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
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

onMounted(() => {
  fetchAlbum();
  fetchData();
  pollInterval = setInterval(() => fetchData(true), 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.admin-chat-toolbar {
  --background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.student-avatar {
  width: 38px;
  height: 38px;
  margin-right: 10px;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title .name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.header-title .status {
  font-size: 0.7rem;
  color: #6366f1;
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

.admin-album-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.section-header .count {
  color: #64748b;
  font-size: 0.75rem;
}

.album-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.album-item {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.album-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-delete {
  position: absolute;
  top: 3px;
  right: 3px;
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
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
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom-right-radius: 4px;
  color: #ffffff;
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

.chat-footer {
  background: #ffffff;
  border-top: 1px solid #e5e5e5;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
}

.attach-btn {
  --padding-start: 0;
  --padding-end: 0;
  margin: 0;
  height: 40px;
  --color: #6366f1;
}

.attach-btn ion-icon {
  font-size: 1.6rem;
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
  --color: #6366f1;
}

.send-btn ion-icon {
  font-size: 1.6rem;
}

/* ATTACHMENTS STYLING */
.attachment-preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.preview-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.preview-file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.preview-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.preview-filename {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-filesize {
  font-size: 0.72rem;
  color: #64748b;
}

.remove-att-btn {
  font-size: 1.2rem;
  --color: #ef4444;
}

.msg-attachments-container {
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attached-image-wrapper {
  position: relative;
  max-width: 240px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.attached-image-preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.attached-file-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  min-width: 190px;
  max-width: 260px;
}

.sent .attached-file-box {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.file-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.file-icon-box.type-pdf { background: #fee2e2; color: #dc2626; }
.file-icon-box.type-doc { background: #dbeafe; color: #2563eb; }
.file-icon-box.type-xls { background: #dcfce7; color: #16a34a; }
.file-icon-box.type-generic { background: #f1f5f9; color: #475569; }

.sent .file-icon-box { background: rgba(255, 255, 255, 0.2); color: #ffffff; }

.file-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.68rem;
  opacity: 0.8;
}

.file-download-icon {
  font-size: 1.1rem;
  color: #94a3b8;
}

.sent .file-download-icon { color: #ffffff; }
</style>
