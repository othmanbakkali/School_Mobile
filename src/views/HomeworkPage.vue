<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('homework.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <!-- Loading State -->
      <div v-if="loading" class="loading-center">
        <ion-spinner name="crescent" color="primary"/>
        <p>{{ t('homework.loading') }}</p>
      </div>

      <div class="fade-in" v-else>
        <div v-if="homeworks.length === 0" class="empty-state">
          📚 {{ t('homework.empty') }}
        </div>
        <div v-for="item in homeworks" :key="item.id" class="premium-card homework-card ion-padding">
          <div class="hw-top">
            <span class="subject-badge">{{ item.subject || t('homework.subject') }}</span>
            <div class="due-timer">
              <ion-icon :icon="timeOutline"></ion-icon>
              <span>{{ formatDate(item.date_due) }}</span>
            </div>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <TranslationWidget v-if="item.description || item.title" :text="item.title + ': ' + item.description" />
          
          <div class="hw-bottom">
            <div class="status-indicator">
              <div class="status-dot" :class="item.state"></div>
              <span>{{ item.state === 'draft' ? t('homework.statusDraft') : t('homework.statusDone') }}</span>
            </div>
            <div v-if="item.attachment" class="hw-attachment" @click.stop="downloadAttachment(item)">
              <ion-icon :icon="documentAttachOutline"></ion-icon>
              <span>{{ t('homework.attachment') }}</span>
            </div>
            <ion-button 
              v-if="item.state === 'draft'"
              size="small" 
              fill="clear" 
              class="done-btn"
              @click.stop="toggleStatus(item)"
            >
              ✓ {{ t('homework.markDone') }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonIcon, IonSpinner, IonButton, IonButtons, IonMenuButton
} from '@ionic/vue';
import { timeOutline, documentAttachOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import { useI18n } from '@/services/translationService';
import TranslationWidget from '@/components/TranslationWidget.vue';

const { t } = useI18n();

const router = useRouter();
const homeworks = ref<any[]>([]);
const loading = ref(true);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const fetchData = async () => {
  const config = odoo.userConfig;
  if (!config) {
    router.replace('/login');
    return;
  }
  loading.value = true;
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });

    if (students && students.length > 0) {
      const selectedId = odoo.selectedStudentId;
      const student = students.find((s: any) => s.id === selectedId) || students[0];
      const bodyWithId = { student_id: student.id };
      homeworks.value = await apiRequest('/api/school/homework', bodyWithId);
    }
  } catch (e: any) {
    console.error('Erreur chargement devoirs:', e);
    if (e.message?.includes('401') || e.message?.includes('Not logged in')) {
      odoo.logout();
      router.replace('/login');
    }
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (item: any) => {
  try {
    const newState = item.state === 'draft' ? 'done' : 'draft';
    await apiRequest('/api/school/homework/status', {
      homework_id: item.id,
      state: newState
    });
    item.state = newState;
  } catch (e) {
    console.error('Failed to update status', e);
  }
};

const downloadAttachment = (item: any) => {
  if (!item.attachment) return;
  const link = document.createElement('a');
  link.href = `data:application/octet-stream;base64,${item.attachment}`;
  link.download = item.attachment_name || 'devoir_piece_jointe';
  link.click();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

/* Loading */
.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 15px;
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 1rem;
  font-weight: 500;
}

/* Devoirs */
.homework-card { margin-bottom: 16px; border-left: 4px solid #6366f1; background: #ffffff; }
.hw-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.subject-badge {
  padding: 4px 10px; border-radius: 8px;
  background: rgba(99, 102, 241, 0.1); color: #6366f1;
  font-size: 0.75rem; font-weight: 700;
}
.due-timer { display: flex; align-items: center; gap: 4px; color: #ef4444; font-size: 0.8rem; font-weight: 600; }
.homework-card h3 { margin: 0 0 6px; font-weight: 700; color: #1e293b; font-size: 1rem; }
.homework-card p { color: #64748b; font-size: 0.9rem; margin: 0 0 12px; }
.hw-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.hw-attachment {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  cursor: pointer;
}

.status-indicator {
  display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #64748b;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; }
.status-dot.done { background: #10b981; }
.done-btn { --color: #10b981; font-weight: 700; font-size: 0.75rem; --padding-end: 0; }
</style>
