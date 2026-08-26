<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('transmission.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Clean Hero Banner -->
        <div class="page-hero-clean">
          <div class="hero-icon-box">
            <span class="hero-icon">📓</span>
          </div>
          <div class="hero-text">
            <h1>{{ t('transmission.title') }}</h1>
            <p>{{ t('transmission.subtitle') }}</p>
          </div>
        </div>

        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
          <p>{{ t('transmission.loading') }}</p>
        </div>

        <div v-else-if="entries.length === 0" class="empty-state-card">
          <ion-icon :icon="bookOutline" class="empty-icon"></ion-icon>
          <p>{{ t('transmission.empty') }}</p>
        </div>

        <div v-else class="cards-list">
          <div v-for="entry in entries" :key="entry.id" 
               class="premium-card transmission-card"
               :class="{ 'announcement-card': entry.isAnnouncement }">
               
            <!-- Type badge -->
            <div class="card-badge-container">
              <div class="card-badge" :class="entry.type || 'info'">
                <span>{{ getTypeIcon(entry.type) }}</span>
                <small>{{ getTypeLabel(entry.type) }}</small>
              </div>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <h3 class="card-title">{{ entry.title || entry.subject || 'Message' }}</h3>
              <p class="card-text">{{ entry.content || entry.body || entry.description }}</p>
              
              <!-- Dynamic Instant Translation Widget -->
              <TranslationWidget 
                v-if="entry.content || entry.body || entry.description" 
                :text="(entry.title || entry.subject || '') + ': ' + (entry.content || entry.body || entry.description)" 
              />

              <!-- Attachment Section -->
              <div v-if="entry.attachment" class="attachment-box" @click.stop="downloadAttachment(entry)">
                <ion-icon :icon="documentAttachOutline"></ion-icon>
                <span>{{ entry.attachment_name || 'Pièce jointe' }}</span>
              </div>

              <!-- Metadata -->
              <div class="card-meta">
                <span class="meta-author">
                  <ion-icon :icon="personOutline"></ion-icon>
                  {{ entry.author || entry.teacher || 'Enseignant' }}
                </span>
                <span class="meta-date">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  {{ formatDate(entry.date || entry.create_date) }}
                </span>
              </div>

              <!-- Signature row -->
              <div v-if="entry.requires_signature" class="signature-row">
                <ion-chip :color="entry.signed ? 'success' : 'warning'" class="sig-chip">
                  <ion-icon :icon="entry.signed ? checkmarkCircleOutline : alertCircleOutline"></ion-icon>
                  <ion-label>{{ entry.signed ? t('transmission.signed') : t('transmission.signatureRequired') }}</ion-label>
                </ion-chip>
                <ion-button v-if="!entry.signed" size="small" class="sign-btn" @click.stop="signEntry(entry)">
                  {{ t('transmission.signBtn') }}
                </ion-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
  IonChip, IonLabel, IonButton, onIonViewWillEnter, toastController
} from '@ionic/vue';
import { 
  bookOutline, 
  personOutline, 
  calendarOutline, 
  checkmarkCircleOutline, 
  alertCircleOutline,
  documentAttachOutline 
} from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import { useI18n } from '@/services/translationService';
import TranslationWidget from '@/components/TranslationWidget.vue';

const { t, locale } = useI18n();

const router = useRouter();
const entries = ref<any[]>([]);
const loading = ref(true);

const getTypeIcon = (type: string) => {
  const icons: any = { 
    info: 'ℹ️', 
    warning: '⚠️', 
    urgent: '🚨', 
    homework: '📚', 
    event: '📅',
    actualite: '📢'
  };
  return icons[type] || '📓';
};

const getTypeLabel = (type: string) => {
  const labels: any = { 
    info: locale.value === 'ar' ? 'معلومة' : 'Information', 
    warning: locale.value === 'ar' ? 'تحذير' : 'Avertissement', 
    urgent: locale.value === 'ar' ? 'عاجل' : 'Urgent', 
    homework: locale.value === 'ar' ? 'واجب' : 'Devoir', 
    event: locale.value === 'ar' ? 'فعالية' : 'Événement',
    actualite: locale.value === 'ar' ? 'خبر' : 'Actualité'
  };
  return labels[type] || (locale.value === 'ar' ? 'رسالة' : 'Message');
};

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

const signEntry = async (entry: any) => {
  try {
    await apiRequest('/api/school/cahier-transmission/sign', { entry_id: entry.id });
    entry.signed = true;
    const toast = await toastController.create({ 
      message: t('transmission.signedSuccess'), 
      duration: 2000, 
      color: 'success', 
      position: 'top' 
    });
    await toast.present();
  } catch (e) {
    console.error(e);
  }
};

const downloadAttachment = (item: any) => {
  if (!item.attachment) return;
  const link = document.createElement('a');
  link.href = `data:application/octet-stream;base64,${item.attachment}`;
  link.download = item.attachment_name || 'piece_jointe';
  link.click();
};

const fetchData = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) { 
    router.replace('/login'); 
    return; 
  }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    const selectedId = odoo.selectedStudentId;
    const student = students.find((s: any) => s.id === selectedId) || students[0];
    
    if (student) {
      // 1. Fetch main transmission entries
      const transmissionEntries = await apiRequest('/api/school/cahier-transmission', { student_id: student.id });
      
      // 2. Fetch announcements in parallel
      let announcementsData = [];
      try {
        announcementsData = await odoo.getAnnouncements(student.level_id?.[0]);
      } catch (annError) {
        console.error('Failed to fetch announcements for transmission notebook', annError);
      }
      
      // 3. Format announcements
      const formattedAnnouncements = announcementsData.map((ann: any) => ({
        id: `ann-${ann.id}`,
        type: 'actualite',
        title: ann.title,
        content: ann.content,
        author: 'Direction de l\'établissement',
        date: ann.date,
        attachment: ann.attachment,
        attachment_name: ann.attachment_name,
        isAnnouncement: true
      }));

      // 4. Merge and sort descending by date
      const merged = [...transmissionEntries, ...formattedAnnouncements];
      merged.sort((a, b) => {
        const dateA = new Date(a.date || a.create_date || 0).getTime();
        const dateB = new Date(b.date || b.create_date || 0).getTime();
        return dateB - dateA;
      });

      entries.value = merged;
    }
  } catch (e) {
    console.error(e);
    // Use demo data if API not available
    entries.value = [
      { id: 1, type: 'info', title: 'Sortie scolaire', content: 'Une sortie au musée est prévue le 15 juin. Merci de signer l\'autorisation.', author: 'Mme. Martin', date: new Date().toISOString(), requires_signature: true, signed: false },
      { id: 2, type: 'homework', title: 'Contrôle de Mathématiques', content: 'Un contrôle de mathématiques aura lieu vendredi prochain. Réviser les chapitres 3 et 4.', author: 'M. Dubois', date: new Date(Date.now() - 86400000).toISOString(), requires_signature: false },
      { id: 'ann-1', type: 'actualite', title: 'Message de la Direction', content: 'Veuillez noter que l\'établissement sera fermé le vendredi après-midi pour formation pédagogique.', author: 'Direction / Administration', date: new Date(Date.now() - 1.5 * 86400000).toISOString(), requires_signature: false, isAnnouncement: true },
      { id: 3, type: 'warning', title: 'Retard répété', content: 'Votre enfant a été en retard 3 fois cette semaine. Merci de prendre les dispositions nécessaires.', author: 'Direction', date: new Date(Date.now() - 2 * 86400000).toISOString(), requires_signature: true, signed: true },
    ];
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => {
  fetchData();
});

onMounted(() => { 
  fetchData(); 
});
</script>

<style scoped>
.gray-bg { 
  --background: #f8fafc; 
}

/* Clean Hero Banner */
.page-hero-clean {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%);
  border-radius: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  background: #5c2d54;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(92, 45, 84, 0.2);
}

.hero-icon {
  font-size: 1.8rem;
}

.hero-text h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
}

.hero-text p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 30px;
}

.transmission-card {
  margin-bottom: 0;
  background: #ffffff;
  padding: 0;
  display: flex;
  flex-direction: row;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.transmission-card:active {
  transform: scale(0.99);
}

.transmission-card.announcement-card {
  border: 1.5px solid rgba(244, 63, 94, 0.2);
  background: linear-gradient(180deg, #ffffff 0%, #fffbfb 100%);
}

.card-badge-container {
  width: 70px;
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
}

.card-badge {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 4px;
  border-top-left-radius: 18px;
  border-bottom-left-radius: 18px;
}

.card-badge span { 
  font-size: 1.5rem; 
}
.card-badge small { 
  font-size: 0.55rem; 
  font-weight: 800; 
  text-transform: uppercase; 
  text-align: center; 
}

.card-badge.info { background: #eff6ff; color: #3b82f6; }
.card-badge.warning { background: #fffbeb; color: #d97706; }
.card-badge.urgent { background: #fef2f2; color: #ef4444; }
.card-badge.homework { background: #f5f3ff; color: #6366f1; }
.card-badge.event { background: #f0fdf4; color: #10b981; }
.card-badge.actualite { background: #fff1f2; color: #f43f5e; }

.card-body { 
  flex: 1; 
  padding: 16px; 
  min-width: 0;
}

.card-title { 
  margin: 0 0 6px; 
  font-weight: 800; 
  font-size: 1rem; 
  color: #0f172a; 
}

.card-text { 
  margin: 0 0 12px; 
  font-size: 0.88rem; 
  color: #475569; 
  line-height: 1.5; 
}

.card-meta { 
  display: flex; 
  gap: 12px; 
  flex-wrap: wrap; 
  margin-top: 10px;
}

.meta-author, .meta-date {
  display: flex; 
  align-items: center; 
  gap: 4px;
  font-size: 0.75rem; 
  color: #94a3b8; 
  font-weight: 600;
}

.attachment-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(244, 63, 94, 0.06);
  border: 1px dashed rgba(244, 63, 94, 0.25);
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #f43f5e;
  cursor: pointer;
  margin-bottom: 10px;
}

.signature-row {
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  margin-top: 12px; 
  padding-top: 10px;
  border-top: 1px dashed #f1f5f9;
}

.sig-chip { 
  height: 28px; 
  font-size: 0.75rem; 
  font-weight: 700;
}

.sign-btn {
  --background: #5c2d54;
  --color: #ffffff;
  font-weight: 700;
  font-size: 0.75rem;
  margin: 0;
}

.loading-center { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  padding: 60px 0; 
  gap: 15px; 
  color: #94a3b8; 
}

.empty-state-card {
  text-align: center; 
  padding: 50px 20px;
  background: white; 
  border-radius: 20px;
  color: #94a3b8;
}
.empty-icon { 
  font-size: 3rem; 
  color: #cbd5e1; 
  margin-bottom: 10px; 
  display: block; 
}
</style>
