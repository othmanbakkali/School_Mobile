
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md" class="chat-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1"></ion-back-button>
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
              rows="1"
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
import { addOutline, sendSharp, checkmarkDoneOutline } from 'ionicons/icons';
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
  background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
  background-repeat: repeat;
  background-size: 400px;
  background-blend-mode: overlay;
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
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.sent .message-bubble {
  background: #dcf8c6;
  border-bottom-right-radius: 2px;
}

.received .message-bubble {
  background: #ffffff;
  border-bottom-left-radius: 2px;
}

.message-text {
  font-size: 0.95rem;
  color: #1e293b;
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
  color: #475569;
  font-weight: 500;
}

.read-icon {
  font-size: 1rem;
  color: #34b7f1;
}

.date-divider {
  text-align: center;
  margin: 20px 0;
}

.date-divider span {
  background: #cbd5e1;
  color: #0f172a;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.empty-chat {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.encryption-notice {
  background: #fef3c7;
  color: #92400e;
  padding: 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  margin-bottom: 20px;
}

.chat-footer {
  background: #f8fafc;
  padding: 8px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}

.input-wrapper {
  flex: 1;
  background: #ffffff;
  border-radius: 24px;
  padding: 5px 15px;
  border: 1px solid #e2e8f0;
}

.message-input {
  --padding-top: 8px;
  --padding-bottom: 8px;
  font-size: 0.95rem;
}

.attach-btn {
  --padding-start: 0;
  --padding-end: 0;
  margin: 0;
  height: 40px;
}

.send-btn {
  background: #128c7e;
  color: white;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.send-btn ion-icon {
  font-size: 1.4rem;
}
</style>
