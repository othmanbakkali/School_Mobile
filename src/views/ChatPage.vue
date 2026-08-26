
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
              <div class="message-text">{{ msg.body }}</div>
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
      <ion-toolbar>
        <div class="input-container">
          <ion-button fill="clear" color="medium" class="attach-btn">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
          <div class="input-wrapper">
            <ion-textarea
              v-model="newMessage"
              placeholder="Message"
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
  IonTextarea, IonButton, IonSpinner
} from '@ionic/vue';
import { checkmarkDoneOutline, sendSharp, addOutline } from 'ionicons/icons';
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';

const messages = ref<any[]>([]);
const newMessage = ref('');
const loading = ref(true);
const sending = ref(false);
const content = ref<any>(null);
let pollInterval: any = null;

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
  const studentId = odoo.selectedStudentId;
  if (!msg || !studentId || sending.value) return;

  sending.value = true;
  try {
    await odoo.sendMessageToAdmin(studentId, msg);
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
</style>
