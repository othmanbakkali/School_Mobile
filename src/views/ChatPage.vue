
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md" class="chat-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-avatar slot="start" class="admin-avatar">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Admin" />
        </ion-avatar>
        <ion-title>
          <div class="header-title">
            <span class="name">Direction Scolaire</span>
            <span class="status">En ligne</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="content" class="chat-bg" :scroll-events="true">
      <div class="messages-container">
        <div v-if="loading" class="ion-text-center ion-padding">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>
        
        <div v-else-if="messages.length === 0" class="empty-chat">
          <div class="encryption-notice">
            🔒 Les messages sont enregistrés sur le serveur Odoo de l'école.
          </div>
          <p>Commencez la discussion avec l'administration.</p>
        </div>

        <template v-else>
          <div v-for="(msg, index) in messages" :key="msg.id" 
               class="message-wrapper" 
               :class="{ 'sent': msg.is_parent, 'received': !msg.is_parent }">
            
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

                  <!-- Cas d'un document (PDF, DOCX, etc.) -->
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

              <!-- Texte du message -->
              <div v-if="msg.body" class="message-text">{{ msg.body }}</div>

              <div class="message-footer">
                <span class="time">{{ formatTime(msg.date) }}</span>
                <ion-icon v-if="msg.is_parent" :icon="checkmarkDoneOutline" class="read-icon"></ion-icon>
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
          <!-- Input fichier caché -->
          <input 
            type="file" 
            ref="fileInputRef" 
            style="display: none" 
            @change="handleFileSelected" 
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />

          <ion-button fill="clear" color="primary" class="attach-btn" @click="triggerFileInput" title="Joindre un fichier">
            <ion-icon :icon="attachOutline"></ion-icon>
          </ion-button>
          
          <div class="input-wrapper">
            <ion-textarea
              v-model="newMessage"
              placeholder="Message..."
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
  IonTextarea, IonButton, IonSpinner, toastController
} from '@ionic/vue';
import { 
  checkmarkDoneOutline, sendSharp, attachOutline, closeCircleOutline,
  documentAttachOutline, documentTextOutline, imageOutline, downloadOutline 
} from 'ionicons/icons';
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';

const messages = ref<any[]>([]);
const newMessage = ref('');
const loading = ref(true);
const sending = ref(false);
const content = ref<any>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedAttachment = ref<{ filename: string, filedata: string, mimetype: string, size: number } | null>(null);
let pollInterval: any = null;

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
};

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Limite de taille à 15 Mo
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
  if (fileInputRef.value) fileInputRef.value.value = '';
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

const fetchData = async (silent = false) => {
  const studentId = odoo.selectedStudentId;
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
  const att = selectedAttachment.value;
  const studentId = odoo.selectedStudentId;
  if ((!msg && !att) || !studentId || sending.value) return;

  sending.value = true;
  try {
    await odoo.sendMessageToAdmin(studentId, msg, att ? {
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
  fetchData();
  pollInterval = setInterval(() => fetchData(true), 5000); // Polling every 5s
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.chat-toolbar {
  --background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.admin-avatar {
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
  color: #10b981;
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
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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
  color: rgba(255, 255, 255, 0.8);
}

.received .time {
  color: #64748b;
}

.read-icon {
  font-size: 1rem;
}

.sent .read-icon {
  color: #ffffff;
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

.encryption-notice {
  background: #eff6ff;
  color: #1e40af;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 20px;
  border: 1px solid #bfdbfe;
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
  background: transparent;
  box-shadow: none;
  --color: #6366f1;
}

.send-btn ion-icon {
  font-size: 1.6rem;
}

/* ========================================================
   CHAT ATTACHMENTS STYLING
   ======================================================== */
.attachment-preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  animation: slideInBottom 0.2s ease-out;
}

@keyframes slideInBottom {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.attached-image-preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.attached-image-wrapper:active .attached-image-preview {
  transform: scale(0.97);
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
  backdrop-filter: blur(4px);
}

.attached-file-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.15s ease;
  min-width: 190px;
  max-width: 260px;
}

.sent .attached-file-box {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.attached-file-box:active {
  transform: scale(0.97);
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

.file-icon-box.type-pdf {
  background: #fee2e2;
  color: #dc2626;
}

.file-icon-box.type-doc {
  background: #dbeafe;
  color: #2563eb;
}

.file-icon-box.type-xls {
  background: #dcfce7;
  color: #16a34a;
}

.file-icon-box.type-generic {
  background: #f1f5f9;
  color: #475569;
}

.sent .file-icon-box {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

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

.sent .file-name {
  color: #ffffff;
}

.received .file-name {
  color: #1e293b;
}

.file-size {
  font-size: 0.68rem;
  opacity: 0.8;
}

.sent .file-size {
  color: rgba(255, 255, 255, 0.8);
}

.received .file-size {
  color: #64748b;
}

.file-download-icon {
  font-size: 1.1rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.sent .file-download-icon {
  color: #ffffff;
}
</style>
