<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Cahier de Transmission</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- 3D Innovative Hero Banner -->
        <div class="page-hero-3d">
          <div class="book-container-3d">
            <div class="book-3d">
              <div class="book-front-3d">
                <span class="emoji-logo">📓</span>
                <span class="sub-logo">ECOLE</span>
              </div>
              <div class="book-back-3d"></div>
              <div class="book-pages-3d"></div>
            </div>
          </div>
          <div class="hero-text-3d">
            <h1>Cahier de Transmission</h1>
            <p>Liaison parents-enseignants & Actualités de l'école</p>
          </div>
        </div>

        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
          <p>Chargement des messages...</p>
        </div>

        <div v-else-if="entries.length === 0" class="empty-state-card">
          <ion-icon :icon="bookOutline" class="empty-icon"></ion-icon>
          <p>Aucun message dans le cahier de transmission.</p>
        </div>

        <div v-else class="cards-list-3d">
          <!-- 3D Tilt Cards -->
          <div v-for="entry in entries" :key="entry.id" 
               class="premium-card transmission-card tilt-card"
               :class="{ 'announcement-card': entry.isAnnouncement }"
               @mousemove="handleTilt"
               @mouseleave="resetTilt"
               @touchmove="handleTouchTilt"
               @touchend="resetTilt"
               style="--rx: 0deg; --ry: 0deg; --tz: 0px;">
               
            <!-- Float-out badge (z-index level 3) -->
            <div class="card-badge-container">
              <div class="card-badge" :class="entry.type || 'info'">
                <span>{{ getTypeIcon(entry.type) }}</span>
                <small>{{ getTypeLabel(entry.type) }}</small>
              </div>
            </div>

            <!-- Card Body with depth variables (z-index levels 2 & 1) -->
            <div class="card-body">
              <h3 class="depth-title">{{ entry.title || entry.subject || 'Message' }}</h3>
              <p class="depth-text">{{ entry.content || entry.body || entry.description }}</p>
              
              <!-- Attachment Section for announcements -->
              <div v-if="entry.attachment" class="attachment-box depth-attachment" @click.stop="downloadAttachment(entry)">
                <ion-icon :icon="documentAttachOutline"></ion-icon>
                <span>{{ entry.attachment_name || 'Pièce jointe' }}</span>
              </div>

              <!-- Metadata -->
              <div class="card-meta depth-meta">
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
              <div v-if="entry.requires_signature" class="signature-row depth-sig">
                <ion-chip :color="entry.signed ? 'success' : 'warning'" class="sig-chip">
                  <ion-icon :icon="entry.signed ? checkmarkCircleOutline : alertCircleOutline"></ion-icon>
                  <ion-label>{{ entry.signed ? 'Lu et signé' : 'Signature requise' }}</ion-label>
                </ion-chip>
                <ion-button v-if="!entry.signed" size="small" class="sign-btn" @click.stop="signEntry(entry)">
                  Signer
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
    info: 'Information', 
    warning: 'Avertissement', 
    urgent: 'Urgent', 
    homework: 'Devoir', 
    event: 'Événement',
    actualite: 'Actualité'
  };
  return labels[type] || 'Message';
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
      message: 'Signé avec succès !', 
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

// 3D Tilt interactivity handlers
const handleTilt = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const xc = rect.width / 2;
  const yc = rect.height / 2;
  // Dynamic calculation for angles
  const angleX = (yc - y) / 12;
  const angleY = (x - xc) / 12;
  
  card.style.setProperty('--rx', `${angleX}deg`);
  card.style.setProperty('--ry', `${angleY}deg`);
  card.style.setProperty('--tz', `12px`);
};

const handleTouchTilt = (e: TouchEvent) => {
  if (e.touches.length === 0) return;
  const touch = e.touches[0];
  const card = e.currentTarget as HTMLElement;
  const rect = card.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  const xc = rect.width / 2;
  const yc = rect.height / 2;
  const angleX = (yc - y) / 14;
  const angleY = (x - xc) / 14;
  
  card.style.setProperty('--rx', `${angleX}deg`);
  card.style.setProperty('--ry', `${angleY}deg`);
  card.style.setProperty('--tz', `10px`);
};

const resetTilt = (e: Event) => {
  const card = e.currentTarget as HTMLElement;
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
  card.style.setProperty('--tz', '0px');
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

/* 3D Floating Book Hero Section */
.page-hero-3d {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 15px 25px 15px;
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%);
  border-radius: 24px;
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.3);
}

.book-container-3d {
  width: 80px;
  height: 95px;
  perspective: 400px;
  margin-bottom: 15px;
}

.book-3d {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateY(-25deg) rotateX(12deg);
  animation: floatBook 3.2s ease-in-out infinite alternate;
}

.book-front-3d {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #5c2d54; /* Eggplant color */
  border-radius: 4px 8px 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  transform: translateZ(10px);
  box-shadow: 6px 6px 18px rgba(0,0,0,0.18);
  border-left: 5px solid #3d1c37;
  transform-style: preserve-3d;
}

.emoji-logo {
  font-size: 2.2rem;
  margin-bottom: 2px;
}

.sub-logo {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.book-back-3d {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #3d1c37;
  border-radius: 8px 4px 4px 8px;
  transform: rotateY(180deg) translateZ(10px);
}

.book-pages-3d {
  position: absolute;
  width: 90%;
  height: 90%;
  background: #f1f5f9;
  top: 5%;
  right: 2%;
  border-radius: 2px 6px 6px 2px;
  box-shadow: inset -4px 0 6px rgba(0,0,0,0.08);
}

@keyframes floatBook {
  0% {
    transform: rotateY(-20deg) rotateX(10deg) translateY(0px);
  }
  100% {
    transform: rotateY(-32deg) rotateX(16deg) translateY(-8px);
  }
}

.hero-text-3d {
  text-align: center;
}
.hero-text-3d h1 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 850;
  color: #1e293b;
  letter-spacing: -0.5px;
}
.hero-text-3d p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
}

/* 3D Tilt Card and Parallax depth styles */
.cards-list-3d {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 30px;
  perspective: 1200px;
}

.transmission-card {
  margin-bottom: 0;
  background: #ffffff;
  padding: 0;
  overflow: visible; /* Required to allow 3D translated layers to protrude */
  display: flex;
  flex-direction: row;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* Actualité Card Border highlight */
.transmission-card.announcement-card {
  border: 1.5px solid rgba(244, 63, 94, 0.15);
  background: linear-gradient(180deg, #ffffff 0%, #fffbfb 100%);
}

.tilt-card {
  transform-style: preserve-3d;
  transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px));
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.02);
}

.tilt-card:active {
  transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

/* Layered depth effects */
.card-badge-container {
  width: 76px;
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
  gap: 5px;
  padding: 15px 5px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  transform: translateZ(25px); /* Highest depth layer */
  transform-style: preserve-3d;
  box-shadow: 2px 0 8px rgba(0,0,0,0.02);
}

.card-badge span { 
  font-size: 1.6rem; 
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
.card-badge.actualite { background: #fff1f2; color: #f43f5e; } /* Rose color for Announcements */

.card-body { 
  flex: 1; 
  padding: 20px; 
  transform-style: preserve-3d;
}

.depth-title { 
  margin: 0 0 8px; 
  font-weight: 800; 
  font-size: 1.05rem; 
  color: #0f172a; 
  transform: translateZ(15px); /* Moderate depth layer */
}

.depth-text { 
  margin: 0 0 15px; 
  font-size: 0.9rem; 
  color: #475569; 
  line-height: 1.5; 
  transform: translateZ(10px); 
}

.depth-meta {
  transform: translateZ(8px);
}

.card-meta { 
  display: flex; 
  gap: 15px; 
  flex-wrap: wrap; 
}

.meta-author, .meta-date {
  display: flex; 
  align-items: center; 
  gap: 5px;
  font-size: 0.75rem; 
  color: #94a3b8; 
  font-weight: 600;
}
.meta-author ion-icon, .meta-date ion-icon { 
  font-size: 0.85rem; 
}

/* Attachment style inside card */
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
  margin-bottom: 15px;
  transition: all 0.2s ease;
}

.attachment-box:active {
  background: rgba(244, 63, 94, 0.12);
  transform: scale(0.98);
}

.depth-attachment {
  transform: translateZ(12px);
}

/* Signature & Actions */
.depth-sig {
  transform: translateZ(14px);
}

.signature-row {
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  margin-top: 15px; 
  padding-top: 12px;
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
  padding: 70px 0; 
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
