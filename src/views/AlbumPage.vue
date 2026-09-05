<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Album Photo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Loading State -->
        <div v-if="loading" class="ion-text-center ion-padding mt-4">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="loading-text">Chargement des souvenirs...</p>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="albumPhotos.length === 0" class="empty-state">
          <ion-icon :icon="imagesOutline" class="empty-icon"></ion-icon>
          <p>Aucune photo disponible pour le moment.</p>
        </div>
        
        <!-- Organized Chronological Sections -->
        <div v-else class="album-container">
          <div v-for="(photos, monthKey) in groupedPhotos" :key="monthKey" class="month-section">
            <!-- Section Header -->
            <div class="month-header">
              <h2>📅 {{ monthKey }}</h2>
              <span class="count-badge">{{ photos.length }} {{ photos.length > 1 ? 'photos' : 'photo' }}</span>
            </div>

            <!-- Polaroid Grid -->
            <div class="polaroid-grid">
              <div v-for="(photo, idx) in photos" 
                   :key="photo.id" 
                   class="polaroid-card"
                   :style="{ '--rotation': getPolaroidAngle(idx) + 'deg' }"
                   @click="openPhoto(photo)">
                
                <div class="polaroid-image-container">
                  <img :src="photo.image_url" :alt="photo.name" class="polaroid-img" />
                  <div class="polaroid-glow"></div>
                </div>

                <!-- Handwriting style caption -->
                <div class="polaroid-caption">
                  <p class="photo-title">{{ truncateTitle(photo.name) }}</p>
                  <p class="photo-date">{{ formatCardDate(photo.date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- High-fidelity Lightbox Modal -->
        <transition name="lightbox-zoom">
          <div v-if="selectedPhoto" class="lightbox-overlay" @click="closePhoto">
            <div class="lightbox-close-btn" @click.stop="closePhoto">
              <ion-icon :icon="closeOutline"></ion-icon>
            </div>
            
            <div class="lightbox-container" @click.stop>
              <img :src="selectedPhoto.image_url" :alt="selectedPhoto.name" class="lightbox-img" />
              
              <div class="lightbox-footer">
                <div class="lightbox-info">
                  <h3>{{ selectedPhoto.name || 'Photo' }}</h3>
                  <p>{{ formatFullDate(selectedPhoto.date) }}</p>
                </div>
                <div class="lightbox-actions">
                  <ion-button color="light" fill="solid" class="download-btn-3d" @click="downloadImage(selectedPhoto)">
                    <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
                    Télécharger
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonIcon, IonSpinner, IonButton, IonButtons, IonMenuButton, 
  onIonViewWillEnter 
} from '@ionic/vue';
import { imagesOutline, downloadOutline, closeOutline } from 'ionicons/icons';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const router = useRouter();
const albumPhotos = ref<any[]>([]);
const loading = ref(true);
const selectedPhoto = ref<any>(null);

// Group photos chronologically by Month Year
const groupedPhotos = computed(() => {
  const groups: { [key: string]: any[] } = {};
  
  // Sort photos descending by date first
  const sortedPhotos = [...albumPhotos.value].sort((a, b) => {
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

  sortedPhotos.forEach(photo => {
    if (!photo.date) {
      const defaultKey = 'Autres moments';
      if (!groups[defaultKey]) groups[defaultKey] = [];
      groups[defaultKey].push(photo);
      return;
    }
    const d = new Date(photo.date);
    const monthYear = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const capitalizedKey = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    
    if (!groups[capitalizedKey]) groups[capitalizedKey] = [];
    groups[capitalizedKey].push(photo);
  });
  return groups;
});

// Polaroid angles logic
const getPolaroidAngle = (idx: number) => {
  const angles = [-2, 1.5, -1, 2, -1.5, 1];
  return angles[idx % angles.length];
};

const truncateTitle = (title: string) => {
  if (!title) return 'Souvenir';
  // Strip extension
  const cleanTitle = title.replace(/\.[^/.]+$/, "");
  if (cleanTitle.length > 20) {
    return cleanTitle.substring(0, 18) + '...';
  }
  return cleanTitle;
};

const formatCardDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const formatFullDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const fetchPhotos = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) {
    router.replace('/login');
    return;
  }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    const selectedId = odoo.selectedStudentId;
    const studentId = students.find((s: any) => s.id === selectedId)?.id || students[0]?.id;
    
    if (studentId) {
      albumPhotos.value = await odoo.getStudentAlbum(studentId);
    }
  } catch (e: any) {
    console.error('Fetch album failed', e);
  } finally {
    loading.value = false;
  }
};

const openPhoto = (photo: any) => {
  selectedPhoto.value = photo;
};

const closePhoto = () => {
  selectedPhoto.value = null;
};

const downloadImage = (photo: any) => {
  const link = document.createElement('a');
  link.href = photo.image_url;
  link.download = photo.name || 'photo_ecole.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleStudentChanged = () => {
  fetchPhotos();
};

onIonViewWillEnter(() => {
  fetchPhotos();
});

onMounted(() => {
  fetchPhotos();
  window.addEventListener('student-changed', handleStudentChanged);
});

onUnmounted(() => {
  window.removeEventListener('student-changed', handleStudentChanged);
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.loading-text {
  color: #94a3b8;
  margin-top: 10px;
  font-weight: 500;
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
  margin-bottom: 12px;
  color: #cbd5e1;
}

.album-container {
  display: flex;
  flex-direction: column;
  gap: 35px;
  padding-bottom: 30px;
}

/* Month headers */
.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.month-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 850;
  color: #1e293b;
}

.count-badge {
  background: rgba(92, 45, 84, 0.08);
  color: #5c2d54;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Polaroid Grid */
.polaroid-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 15px;
  padding: 10px 5px;
}

/* Polaroid Card styling */
.polaroid-card {
  background: #ffffff;
  padding: 8px 8px 16px 8px;
  border-radius: 4px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.07), 0 3px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transform: rotate(var(--rotation, 0deg));
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
  transform-style: preserve-3d;
}

.polaroid-card:active {
  transform: scale(0.98) rotate(0deg);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.polaroid-image-container {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f1f5f9;
  border-radius: 2px;
  position: relative;
}

.polaroid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.polaroid-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
  pointer-events: none;
}

/* Caption spacing and typography */
.polaroid-caption {
  padding-top: 10px;
  text-align: center;
}

.photo-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
  font-family: 'Courier New', Courier, monospace; /* Handwriting mock */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-date {
  margin: 2px 0 0;
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
}

/* Lightbox full-screen viewer */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.85); /* Slate dark backdrop */
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-close-btn {
  position: absolute;
  top: 25px;
  right: 25px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: background 0.2s;
}

.lightbox-close-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.lightbox-img {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.lightbox-footer {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: white;
}

.lightbox-info h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.lightbox-info p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.lightbox-actions {
  display: flex;
  justify-content: center;
}

.download-btn-3d {
  --background: #ffffff;
  --color: #0f172a;
  --border-radius: 12px;
  font-weight: 750;
  font-size: 0.85rem;
  width: 100%;
  height: 44px;
  box-shadow: 0 4px 12px rgba(255,255,255,0.2);
}

/* Lightbox zoom animation transitions */
.lightbox-zoom-enter-active,
.lightbox-zoom-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-zoom-enter-active .lightbox-container,
.lightbox-zoom-leave-active .lightbox-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lightbox-zoom-enter-from,
.lightbox-zoom-leave-to {
  opacity: 0;
}

.lightbox-zoom-enter-from .lightbox-container {
  transform: scale(0.85);
}

.lightbox-zoom-leave-to .lightbox-container {
  transform: scale(0.9);
}
</style>
