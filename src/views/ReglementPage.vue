<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('reglement.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Hero Banner -->
        <div class="reglement-hero">
          <div class="hero-icon-box">
            <span class="hero-icon">📜</span>
          </div>
          <div class="hero-text">
            <h1>{{ t('reglement.title') }}</h1>
            <p>{{ t('reglement.subtitle') }}</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <ion-searchbar 
            v-model="searchQuery" 
            :placeholder="t('reglement.searchPlaceholder')" 
            mode="ios"
            class="custom-searchbar"
          ></ion-searchbar>
        </div>

        <!-- Category Filter Chips -->
        <div class="category-chips-container">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            class="cat-chip"
            :class="{ active: selectedCategory === cat.id }"
            @click="selectedCategory = cat.id"
          >
            <span>{{ cat.icon }}</span>
            <span>{{ cat.label }}</span>
            <small v-if="getCategoryCount(cat.id) > 0" class="chip-count">
              {{ getCategoryCount(cat.id) }}
            </small>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
          <p>{{ t('reglement.loading') }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredRegulations.length === 0" class="empty-state-card">
          <div class="empty-icon-wrap">📜</div>
          <h3>{{ t('reglement.empty') }}</h3>
          <p v-if="searchQuery">Essayez un autre mot-clé ou réinitialisez le filtre.</p>
        </div>

        <!-- Cards List -->
        <div v-else class="regulations-list">
          <div 
            v-for="item in filteredRegulations" 
            :key="item.id"
            class="premium-card reg-card"
            :class="{ 'pinned-card': item.is_pinned }"
          >
            <!-- Card Header Badge & Pin -->
            <div class="reg-top-bar">
              <div class="category-badge" :class="item.category || 'general'">
                <span>{{ getCategoryIcon(item.category) }}</span>
                <span>{{ getCategoryLabel(item.category) }}</span>
              </div>
              <span v-if="item.is_pinned" class="pinned-pill">
                📌 {{ t('reglement.pinnedBadge') }}
              </span>
            </div>

            <!-- Title -->
            <h3 
              class="reg-title"
              :dir="isArabic(item.title) ? 'rtl' : 'ltr'"
              :class="{ 'ar-text': isArabic(item.title) }"
            >
              {{ item.title }}
            </h3>

            <!-- Content text -->
            <div 
              class="reg-content"
              :dir="isArabic(item.content) ? 'rtl' : 'ltr'"
              :class="{ 'ar-text': isArabic(item.content) }"
            >
              <p>{{ item.content }}</p>
            </div>

            <!-- Attachment File Download -->
            <div 
              v-if="item.attachment" 
              class="attachment-download-box" 
              @click.stop="downloadAttachment(item)"
            >
              <div class="att-icon-box">
                <ion-icon :icon="documentAttachOutline"></ion-icon>
              </div>
              <div class="att-details">
                <span class="att-name">{{ item.attachment_name || 'Document officiel (PDF)' }}</span>
                <span class="att-action">{{ t('reglement.attachmentBtn') }} ⬇️</span>
              </div>
            </div>

            <!-- Metadata Footer -->
            <div class="reg-footer">
              <div class="meta-item">
                <ion-icon :icon="personCircleOutline"></ion-icon>
                <span>{{ item.author || 'Direction Pédagogique' }}</span>
              </div>
              <div v-if="item.date" class="meta-item">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{ formatDate(item.date) }}</span>
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
  IonSearchbar, IonRefresher, IonRefresherContent,
  onIonViewWillEnter
} from '@ionic/vue';
import { 
  documentAttachOutline, 
  calendarOutline, 
  personCircleOutline 
} from 'ionicons/icons';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { downloadBase64File } from '@/services/fileDownloader';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();
const router = useRouter();

const regulations = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref('all');

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');

const categories = computed(() => [
  { id: 'all', icon: '📂', label: t('reglement.categoryAll') },
  { id: 'law', icon: '⚖️', label: t('reglement.categoryLaw') },
  { id: 'discipline', icon: '⚠️', label: t('reglement.categoryDiscipline') },
  { id: 'attendance', icon: '⏰', label: t('reglement.categoryAttendance') },
  { id: 'safety', icon: '🛡️', label: t('reglement.categorySafety') },
  { id: 'hygiene', icon: '👔', label: t('reglement.categoryHygiene') },
  { id: 'academic', icon: '📚', label: t('reglement.categoryAcademic') },
  { id: 'other', icon: '📌', label: t('reglement.categoryOther') },
]);

const getCategoryCount = (catId: string) => {
  if (catId === 'all') return regulations.value.length;
  return regulations.value.filter(r => r.category === catId).length;
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'law': return '⚖️';
    case 'discipline': return '⚠️';
    case 'attendance': return '⏰';
    case 'safety': return '🛡️';
    case 'hygiene': return '👔';
    case 'academic': return '📚';
    case 'general': return '📜';
    default: return '📌';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'law': return locale.value === 'ar' ? 'نصوص تشريعية ومذكرات' : 'Lois & Circulaires';
    case 'discipline': return locale.value === 'ar' ? 'الانضباط وقواعد السلوك' : 'Discipline & Règles';
    case 'attendance': return locale.value === 'ar' ? 'المواظبة وأوقات الدخول' : 'Horaires & Assiduité';
    case 'safety': return locale.value === 'ar' ? 'الأمن والسلامة' : 'Sécurité & Vivre ensemble';
    case 'hygiene': return locale.value === 'ar' ? 'الهندام والنظافة والصحة' : 'Tenue & Hygiène';
    case 'academic': return locale.value === 'ar' ? 'العمل المدرسي والواجبات' : 'Travail Scolaire';
    case 'general': return locale.value === 'ar' ? 'مبادئ عامة' : 'Principes Généraux';
    default: return locale.value === 'ar' ? 'بند تنظيمي' : 'Règlement';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const lang = locale.value === 'ar' ? 'ar-MA' : 'fr-FR';
  return new Date(dateStr).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
};

const downloadAttachment = (item: any) => {
  if (!item || !item.attachment) return;
  downloadBase64File(item.attachment, item.attachment_name || 'reglement_interieur.pdf');
};

const filteredRegulations = computed(() => {
  let list = regulations.value;

  if (selectedCategory.value !== 'all') {
    list = list.filter(r => r.category === selectedCategory.value);
  }

  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(r => 
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.content && r.content.toLowerCase().includes(q)) ||
      (r.author && r.author.toLowerCase().includes(q))
    );
  }

  return list;
});

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
    const student = (students && students.find((s: any) => s.id === selectedId)) || (students && students[0]);

    const result = await apiRequest('/api/school/regulations', { 
      student_id: student ? student.id : null 
    });
    regulations.value = Array.isArray(result) ? result : [];
  } catch (err) {
    console.error('Erreur chargement règlement intérieur:', err);
    regulations.value = [];
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await fetchData();
  event.target.complete();
};

onIonViewWillEnter(() => {
  fetchData();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

/* Hero Card */
.reglement-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  padding: 22px 20px;
  margin-bottom: 16px;
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
  position: relative;
  overflow: hidden;
}

.reglement-hero::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.hero-icon-box {
  width: 54px;
  height: 54px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.hero-text h1 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #ffffff;
}

.hero-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.35;
}

/* Search bar */
.search-container {
  margin-bottom: 14px;
}

.custom-searchbar {
  --background: #ffffff;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  --border-radius: 14px;
  padding: 0;
}

/* Category Chips Carousel */
.category-chips-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 16px;
  scrollbar-width: none;
}
.category-chips-container::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.cat-chip.active {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.chip-count {
  background: rgba(0, 0, 0, 0.08);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.72rem;
}
.cat-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Cards List */
.regulations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reg-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.reg-card:active {
  transform: scale(0.99);
}

.pinned-card {
  border-left: 5px solid #f59e0b;
  background: linear-gradient(180deg, #fffbeb 0%, #ffffff 25%);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.08);
}

.reg-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}

.category-badge.law { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.category-badge.discipline { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
.category-badge.attendance { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.category-badge.safety { background: rgba(16, 185, 129, 0.12); color: #059669; }
.category-badge.hygiene { background: rgba(168, 85, 247, 0.12); color: #9333ea; }
.category-badge.academic { background: rgba(6, 182, 212, 0.12); color: #0891b2; }

.pinned-pill {
  font-size: 0.72rem;
  font-weight: 800;
  background: #fef3c7;
  color: #b45309;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #fde68a;
}

.reg-title {
  margin: 0 0 10px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.4;
}

.reg-content {
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 14px;
  white-space: pre-wrap;
}

.ar-text {
  text-align: right !important;
  direction: rtl !important;
  font-family: 'Cairo', 'Amiri', 'Segoe UI', Tahoma, sans-serif !important;
}

/* Attachment download button */
.attachment-download-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.attachment-download-box:active {
  background: #f1f5f9;
}

.att-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.att-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.att-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.att-action {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4f46e5;
}

/* Footer metadata */
.reg-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.78rem;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Loading & Empty States */
.loading-center {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-state-card {
  text-align: center;
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  margin-top: 10px;
}

.empty-icon-wrap {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-state-card h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.empty-state-card p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}
</style>
