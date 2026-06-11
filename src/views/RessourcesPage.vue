<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Ressources</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <div class="page-hero">
          <div class="hero-icon">📚</div>
          <h1>Ressources Pédagogiques</h1>
          <p>Cours, exercices et documents partagés</p>
        </div>

        <!-- Search bar -->
        <div class="search-box">
          <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
          <input v-model="searchQuery" placeholder="Rechercher une ressource..." class="search-input" />
        </div>

        <!-- Category filter -->
        <div class="category-scroll">
          <div v-for="cat in categories" :key="cat.id"
            :class="['cat-chip', { active: activeCategory === cat.id }]"
            @click="activeCategory = cat.id">
            {{ cat.icon }} {{ cat.label }}
          </div>
        </div>

        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
        </div>

        <div v-else-if="filteredResources.length === 0" class="empty-state-card">
          <ion-icon :icon="documentOutline" class="empty-icon"></ion-icon>
          <p>Aucune ressource disponible.</p>
        </div>

        <div v-else class="resources-grid">
          <div v-for="res in filteredResources" :key="res.id"
            class="premium-card resource-card"
            @click="openResource(res)">
            <div class="res-icon-box" :class="res.type">
              {{ getFileIcon(res.type, res.mimetype) }}
            </div>
            <div class="res-info">
              <h3>{{ res.name }}</h3>
              <p>{{ res.subject || 'Général' }} · {{ res.teacher || '' }}</p>
              <div class="res-meta">
                <span class="res-size">{{ res.size || '' }}</span>
                <span class="res-date">{{ formatDate(res.date || res.create_date) }}</span>
              </div>
            </div>
            <ion-button fill="clear" size="small" @click.stop="downloadResource(res)">
              <ion-icon slot="icon-only" :icon="downloadOutline"></ion-icon>
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
  IonButtons, IonMenuButton, IonIcon, IonSpinner, IonButton, onIonViewWillEnter
} from '@ionic/vue';
import { searchOutline, documentOutline, downloadOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const searchQuery = ref('');
const activeCategory = ref('all');

const categories = [
  { id: 'all', icon: '🗂️', label: 'Tout' },
  { id: 'pdf', icon: '📄', label: 'PDF' },
  { id: 'video', icon: '🎥', label: 'Vidéos' },
  { id: 'image', icon: '🖼️', label: 'Images' },
  { id: 'doc', icon: '📝', label: 'Documents' },
];

const resources = ref<any[]>([]);

const filteredResources = computed(() => {
  let res = resources.value;
  if (activeCategory.value !== 'all') {
    res = res.filter(r => (r.type || '').includes(activeCategory.value) || (r.mimetype || '').includes(activeCategory.value));
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    res = res.filter(r => (r.name || '').toLowerCase().includes(q) || (r.subject || '').toLowerCase().includes(q));
  }
  return res;
});

const getFileIcon = (type: string, mime: string) => {
  if ((mime || '').includes('pdf') || type === 'pdf') return '📄';
  if ((mime || '').includes('video') || type === 'video') return '🎥';
  if ((mime || '').includes('image') || type === 'image') return '🖼️';
  if ((mime || '').includes('word') || (mime || '').includes('document')) return '📝';
  if ((mime || '').includes('excel') || (mime || '').includes('sheet')) return '📊';
  if ((mime || '').includes('powerpoint') || (mime || '').includes('presentation')) return '📊';
  return '📁';
};

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

const openResource = (res: any) => {
  if (res.url) window.open(res.url, '_blank');
};

const downloadResource = (res: any) => {
  if (res.url) {
    const link = document.createElement('a');
    link.href = res.url;
    link.download = res.name;
    link.click();
  } else if (res.datas) {
    const link = document.createElement('a');
    link.href = `data:${res.mimetype || 'application/octet-stream'};base64,${res.datas}`;
    link.download = res.name;
    link.click();
  }
};

const fetchData = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) { router.replace('/login'); return; }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    const selectedId = odoo.selectedStudentId;
    const student = students.find((s: any) => s.id === selectedId) || students[0];
    if (student) {
      resources.value = await apiRequest('/api/school/resources', {
        student_id: student.id,
        level_id: student.level_id?.[0]
      });
    }
  } catch (e) {
    // Demo data
    resources.value = [
      { id: 1, name: 'Cours de Mathématiques - Chapitre 5', subject: 'Mathématiques', teacher: 'M. Dubois', type: 'pdf', mimetype: 'application/pdf', date: new Date().toISOString(), url: null },
      { id: 2, name: 'Exercices de Français - Conjugaison', subject: 'Français', teacher: 'Mme. Martin', type: 'doc', mimetype: 'application/msword', date: new Date(Date.now() - 86400000).toISOString(), url: null },
      { id: 3, name: 'Carte du Monde - Histoire-Géo', subject: 'Histoire-Géo', teacher: 'M. Alaoui', type: 'image', mimetype: 'image/jpeg', date: new Date(Date.now() - 2 * 86400000).toISOString(), url: null },
      { id: 4, name: 'Résumé Sciences Naturelles S1', subject: 'Sciences', teacher: 'Mme. Benali', type: 'pdf', mimetype: 'application/pdf', date: new Date(Date.now() - 3 * 86400000).toISOString(), url: null },
    ];
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => fetchData());
onMounted(() => fetchData());
</script>

<style scoped>
.gray-bg { --background: #f8fafc; }
.page-hero { text-align: center; padding: 20px 0 25px; }
.hero-icon { font-size: 3rem; margin-bottom: 10px; }
.page-hero h1 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1e293b; }
.page-hero p { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; }
.loading-center { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 15px; }

.search-box {
  display: flex; align-items: center; gap: 10px;
  background: white; border-radius: 14px; padding: 12px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-bottom: 15px;
}
.search-icon { font-size: 1.1rem; color: #94a3b8; flex-shrink: 0; }
.search-input { border: none; outline: none; flex: 1; font-size: 0.95rem; color: #1e293b; background: transparent; }
.search-input::placeholder { color: #94a3b8; }

.category-scroll {
  display: flex; gap: 10px; overflow-x: auto; padding-bottom: 12px;
  margin-bottom: 20px; scrollbar-width: none;
}
.category-scroll::-webkit-scrollbar { display: none; }
.cat-chip {
  padding: 8px 16px; border-radius: 50px; border: 1.5px solid #e2e8f0;
  font-size: 0.8rem; font-weight: 700; color: #64748b; white-space: nowrap;
  background: white; cursor: pointer; transition: all 0.2s;
}
.cat-chip.active { background: #6366f1; color: white; border-color: #6366f1; }

.empty-state-card { text-align: center; padding: 50px 20px; background: white; border-radius: 20px; color: #94a3b8; }
.empty-icon { font-size: 3rem; color: #cbd5e1; margin-bottom: 10px; display: block; }

.resources-grid { display: flex; flex-direction: column; gap: 12px; }
.resource-card {
  display: flex; align-items: center; gap: 15px; padding: 14px 16px;
  background: white; cursor: pointer; transition: transform 0.2s;
}
.resource-card:active { transform: scale(0.98); }
.res-icon-box {
  width: 50px; height: 50px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; flex-shrink: 0; background: #f1f5f9;
}
.res-info { flex: 1; min-width: 0; }
.res-info h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.res-info p { margin: 3px 0 5px; font-size: 0.75rem; color: #64748b; }
.res-meta { display: flex; gap: 10px; }
.res-size, .res-date { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
</style>
