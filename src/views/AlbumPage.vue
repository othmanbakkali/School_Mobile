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
        <div v-if="loading" class="ion-text-center ion-padding mt-4">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-2">Chargement des photos...</p>
        </div>
        
        <div v-else-if="albumPhotos.length === 0" class="empty-state">
          <ion-icon :icon="imagesOutline" class="empty-icon"></ion-icon>
          <p>Aucune photo dans l'album.</p>
        </div>
        
        <div v-else class="photo-grid">
          <div v-for="photo in albumPhotos" :key="photo.id" class="photo-item premium-card">
            <img :src="photo.image_url" :alt="photo.name" @click="openPhoto(photo)" />
            <div class="photo-actions">
              <ion-button fill="clear" size="small" @click="downloadImage(photo)">
                <ion-icon slot="icon-only" :icon="downloadOutline"></ion-icon>
              </ion-button>
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
  IonIcon, IonSpinner, IonButton, IonButtons, IonMenuButton, onIonViewWillEnter
} from '@ionic/vue';
import { imagesOutline, downloadOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const albumPhotos = ref<any[]>([]);
const loading = ref(true);

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

onIonViewWillEnter(() => {
  fetchPhotos();
});

onMounted(() => {
    fetchPhotos();
});

const openPhoto = (photo: any) => {
  console.log("Ouvrir", photo.name);
};

const downloadImage = (photo: any) => {
  const link = document.createElement('a');
  link.href = photo.image_url;
  link.download = photo.name || 'photo_ecole.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
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

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding-bottom: 20px;
}

.photo-item {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  background: white;
  position: relative;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-actions {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.photo-actions ion-button {
  --color: #1e293b;
  margin: 0;
}

.photo-item:active img {
  transform: scale(0.95);
}
</style>
