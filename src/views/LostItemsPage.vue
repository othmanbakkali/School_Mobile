<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-title>Objets Perdus</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <div class="section-title">
          <h2>🔍 Objets Trouvés</h2>
          <p>Consultez la liste des objets en attente au secrétariat</p>
        </div>

        <div v-if="loading" class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <div v-else-if="items.length === 0" class="empty-state-card">
          <p>Aucun objet perdu signalé pour le moment.</p>
        </div>

        <div v-else class="lost-grid">
          <div v-for="item in items" :key="item.id" class="premium-card lost-card">
            <div class="lost-image-box">
              <img v-if="item.photo" :src="'data:image/png;base64,' + item.photo" />
              <div v-else class="lost-placeholder">📦</div>
            </div>
            <div class="lost-content ion-padding">
              <h3>{{ item.name }}</h3>
              <div class="lost-meta">
                <span><ion-icon :icon="locationOutline"></ion-icon> {{ item.location || 'Lieu non spécifié' }}</span>
                <span><ion-icon :icon="calendarOutline"></ion-icon> {{ formatDate(item.date_found) }}</span>
              </div>
              <p v-if="item.description">{{ item.description }}</p>
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
  IonSpinner, IonIcon, onIonViewWillEnter
} from '@ionic/vue';
import { locationOutline, calendarOutline } from 'ionicons/icons';
import { ref } from 'vue';
import { odoo } from '@/services/odoo';

const items = ref<any[]>([]);
const loading = ref(true);

const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR');
};

const fetchItems = async () => {
    loading.value = true;
    try {
        items.value = await odoo.getLostItems();
    } catch (e) {
        console.error('Fetch lost items failed', e);
    } finally {
        loading.value = false;
    }
};

onIonViewWillEnter(() => {
  fetchItems();
});
</script>

<style scoped>
.gray-bg { --background: #f8fafc; }
.section-title { margin-bottom: 25px; }
.section-title h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.section-title p { margin: 4px 0 0; color: #94a3b8; font-size: 0.95rem; }

.lost-grid { display: grid; grid-template-columns: 1fr; gap: 20px; padding-bottom: 20px; }
.lost-card { background: white; overflow: hidden; }
.lost-image-box { width: 100%; height: 200px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
.lost-image-box img { width: 100%; height: 100%; object-fit: cover; }
.lost-placeholder { font-size: 4rem; }
.lost-content h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b; }
.lost-meta { display: flex; gap: 15px; margin: 8px 0; color: #64748b; font-size: 0.85rem; }
.lost-meta span { display: flex; align-items: center; gap: 5px; }
.lost-content p { margin: 10px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.5; }

.empty-state-card { background: white; padding: 30px; border-radius: 20px; text-align: center; color: #94a3b8; }
</style>
