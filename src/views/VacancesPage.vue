<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('vacances.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Hero Banner -->
        <div class="vacances-hero">
          <div class="hero-left">
            <span class="hero-tag">{{ t('vacances.schoolYear') }}</span>
            <h1 class="hero-title">{{ t('vacances.title') }}</h1>
            <p class="hero-subtitle">{{ t('vacances.subtitle') }}</p>
          </div>
          <div class="hero-icon-container">
            <span class="hero-emoji">🏖️</span>
          </div>
        </div>

        <!-- Spotlight Card: Next Upcoming Holiday -->
        <div v-if="nextHoliday" class="next-holiday-card">
          <div class="spotlight-header">
            <div class="spotlight-badge">
              <ion-icon :icon="sparklesOutline"></ion-icon>
              <span>{{ t('vacances.nextHoliday') }}</span>
            </div>
            <div class="countdown-chip" :class="getCountdownClass(nextHoliday)">
              <ion-icon :icon="timeOutline"></ion-icon>
              <span>{{ formatCountdown(nextHoliday) }}</span>
            </div>
          </div>
          
          <div class="spotlight-body">
            <h3 class="spotlight-title">{{ nextHoliday.title }}</h3>
            <p class="spotlight-desc" v-if="nextHoliday.content">{{ nextHoliday.content }}</p>
            
            <div class="spotlight-meta">
              <div class="meta-item">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{ formatHolidayDate(nextHoliday.date) }}</span>
              </div>
              <div class="meta-item duration" v-if="getDurationBadge(nextHoliday)">
                <ion-icon :icon="hourglassOutline"></ion-icon>
                <span>{{ getDurationBadge(nextHoliday) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Segment -->
        <div class="segment-container">
          <button 
            class="seg-btn" 
            :class="{ active: activeFilter === 'upcoming' }"
            @click="activeFilter = 'upcoming'">
            <ion-icon :icon="timeOutline"></ion-icon>
            <span>{{ t('vacances.filterUpcoming', { n: String(upcomingCount) }) }}</span>
          </button>
          <button 
            class="seg-btn" 
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'">
            <ion-icon :icon="listOutline"></ion-icon>
            <span>{{ t('vacances.filterAll', { n: String(allCount) }) }}</span>
          </button>
          <button 
            class="seg-btn" 
            :class="{ active: activeFilter === 'past' }"
            @click="activeFilter = 'past'">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
            <span>{{ t('vacances.filterPast', { n: String(pastCount) }) }}</span>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary" />
          <p>{{ t('vacances.loading') }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredHolidays.length === 0" class="empty-card">
          <ion-icon :icon="calendarClearOutline" class="empty-icon"></ion-icon>
          <p>{{ t('vacances.empty') }}</p>
        </div>

        <!-- Holidays List -->
        <div v-else class="holidays-list">
          <div 
            v-for="item in filteredHolidays" 
            :key="item.id" 
            class="holiday-card"
            :class="item.status">
            
            <!-- Date block -->
            <div class="date-block" :class="item.status">
              <span class="date-day">{{ extractDay(item.date) }}</span>
              <span class="date-month">{{ extractMonth(item.date) }}</span>
            </div>

            <!-- Content block -->
            <div class="holiday-content">
              <div class="holiday-top-row">
                <span class="status-badge" :class="item.status">
                  <span class="status-dot"></span>
                  {{ getStatusLabel(item.status) }}
                </span>
                <span class="source-tag" :class="item.source">
                  {{ item.source === 'transmission' ? t('vacances.originTransmission') : t('vacances.originAnnouncement') }}
                </span>
              </div>

              <h3 class="holiday-title">{{ item.title }}</h3>
              <p class="holiday-text" v-if="item.content">{{ item.content }}</p>

              <!-- Attachment Section -->
              <div v-if="item.attachment" class="attachment-box" @click.stop="downloadAttachment(item)">
                <ion-icon :icon="documentAttachOutline"></ion-icon>
                <span>{{ item.attachment_name || 'Pièce jointe' }}</span>
              </div>

              <!-- Footer with duration / countdown -->
              <div class="holiday-footer">
                <span class="duration-pill" v-if="getDurationBadge(item)">
                  🏖️ {{ getDurationBadge(item) }}
                </span>
                <span class="countdown-text" v-if="item.status === 'upcoming'">
                  {{ formatCountdown(item) }}
                </span>
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
  IonButtons, IonMenuButton, IonIcon, IonSpinner, onIonViewWillEnter
} from '@ionic/vue';
import { 
  calendarOutline, 
  timeOutline, 
  sparklesOutline,
  hourglassOutline,
  listOutline,
  checkmarkDoneOutline,
  calendarClearOutline,
  documentAttachOutline 
} from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();
const router = useRouter();

const loading = ref(true);
const holidays = ref<any[]>([]);
const activeFilter = ref<'upcoming' | 'all' | 'past'>('upcoming');

// Robust date parsing (cross-browser / iOS Safari / node / mobile WebView)
const parseDateSafe = (d: any): number => {
  if (!d) return 0;
  if (d instanceof Date) return d.getTime();
  if (typeof d === 'number') return d;
  const s = String(d).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const h = parseInt(match[4] || '0', 10);
    const min = parseInt(match[5] || '0', 10);
    const sec = parseInt(match[6] || '0', 10);
    return new Date(y, m, day, h, min, sec).getTime();
  }
  const t = new Date(s.replace(' ', 'T')).getTime();
  return isNaN(t) ? (new Date(d).getTime() || 0) : t;
};

// Check if a record is related to holidays/vacations
const isVacanceItem = (item: any): boolean => {
  if (!item) return false;
  const text = `${item.title || ''} ${item.content || item.body || ''} ${item.description || ''}`.toLowerCase();
  const holidayRegex = /(عطلة|عطل|أعياد|عيد|إجازة|اجازة|فترة بينية|فترات بينية|vacance|vacances|férié|ferie|fête|fete|congé|conge|holiday|holidays|aid|aïd)/i;
  return holidayRegex.test(text);
};

// Format date in human language
const formatHolidayDate = (d: string) => {
  const ts = parseDateSafe(d);
  if (!ts) return '';
  const lang = locale.value === 'ar' ? 'ar-MA' : 'fr-FR';
  return new Date(ts).toLocaleDateString(lang, { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const extractDay = (d: string) => {
  const ts = parseDateSafe(d);
  if (!ts) return '--';
  return new Date(ts).getDate();
};

const extractMonth = (d: string) => {
  const ts = parseDateSafe(d);
  if (!ts) return '';
  const lang = locale.value === 'ar' ? 'ar-MA' : 'fr-FR';
  return new Date(ts).toLocaleDateString(lang, { month: 'short' }).toUpperCase();
};

// Extract duration mention if present in title (e.g. "(8 jours)" or "(8 أيام)")
const getDurationBadge = (item: any) => {
  const text = `${item.title || ''} ${item.content || ''}`;
  const matchDaysAr = text.match(/(\d+)\s*(?:أيام|ايام|يوم)/);
  if (matchDaysAr) {
    return `${matchDaysAr[1]} ${locale.value === 'ar' ? 'أيام' : 'jours'}`;
  }
  const matchDaysFr = text.match(/(\d+)\s*(?:jours|jour)/i);
  if (matchDaysFr) {
    return `${matchDaysFr[1]} ${locale.value === 'ar' ? 'أيام' : 'jours'}`;
  }
  return '';
};

// Compute days difference to now
const getDaysDifference = (item: any): number => {
  const ts = parseDateSafe(item.date);
  if (!ts) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(ts);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (24 * 3600 * 1000));
};

const formatCountdown = (item: any): string => {
  const diff = getDaysDifference(item);
  if (diff === 0) return t('vacances.today');
  if (diff === 1) return t('vacances.inDaysSingle');
  if (diff > 1) return t('vacances.inDays', { n: String(diff) });
  if (diff < 0) return t('vacances.passed');
  return '';
};

const getCountdownClass = (item: any): string => {
  const diff = getDaysDifference(item);
  if (diff <= 3 && diff >= 0) return 'urgent-chip';
  if (diff > 0) return 'upcoming-chip';
  return 'past-chip';
};

const getStatusLabel = (status: string): string => {
  if (status === 'upcoming') return t('vacances.upcoming');
  if (status === 'ongoing') return t('vacances.ongoing');
  return t('vacances.passed');
};

const downloadAttachment = (item: any) => {
  if (!item.attachment) return;
  const link = document.createElement('a');
  link.href = `data:application/octet-stream;base64,${item.attachment}`;
  link.download = item.attachment_name || 'vacances_info';
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
      // 1. Fetch transmission entries to extract any vacation messages
      let transmissionEntries: any[] = [];
      try {
        transmissionEntries = await apiRequest('/api/school/cahier-transmission', { student_id: student.id });
      } catch (e) {
        console.warn('Erreur transmission entries:', e);
      }

      // 2. Fetch announcements (vacation calendar published by school)
      let announcementsData: any[] = [];
      try {
        announcementsData = await odoo.getAnnouncements(student.level_id?.[0]);
      } catch (e) {
        console.warn('Erreur announcements:', e);
      }

      // 3. Keep transmission entries that are holiday/vacation notices
      const vacTransmissions = (Array.isArray(transmissionEntries) ? transmissionEntries : [])
        .filter(item => isVacanceItem(item))
        .map(item => ({
          ...item,
          source: 'transmission'
        }));

      // 4. Keep announcements that are holiday/vacation notices
      const vacAnnouncements = (Array.isArray(announcementsData) ? announcementsData : [])
        .filter(item => isVacanceItem(item))
        .map(item => ({
          ...item,
          source: 'announcement'
        }));

      // 5. Combine and compute status
      const combined = [...vacTransmissions, ...vacAnnouncements];

      // Deduplicate by title & date if duplicate exists in both tables
      const seen = new Set();
      const uniqueHolidays: any[] = [];
      for (const item of combined) {
        const key = `${item.title}_${item.date}`;
        if (!seen.has(key)) {
          seen.add(key);
          const diff = getDaysDifference(item);
          let status: 'upcoming' | 'ongoing' | 'past' = 'past';
          if (diff > 0) {
            status = 'upcoming';
          } else if (diff === 0 || diff >= -1) {
            status = 'ongoing';
          } else {
            status = 'past';
          }
          uniqueHolidays.push({
            ...item,
            status,
            diff
          });
        }
      }

      // Sort: upcoming items chronologically (nearest to now first), then past items descending
      uniqueHolidays.sort((a, b) => {
        const timeA = parseDateSafe(a.date);
        const timeB = parseDateSafe(b.date);
        // If both upcoming: ascending order (nearest holiday first)
        if (a.diff >= 0 && b.diff >= 0) {
          return timeA - timeB;
        }
        // If both past: descending order (most recently passed first)
        if (a.diff < 0 && b.diff < 0) {
          return timeB - timeA;
        }
        // Upcoming before past
        return a.diff >= 0 ? -1 : 1;
      });

      holidays.value = uniqueHolidays;
    }
  } catch (err) {
    console.error('Failed to load vacances:', err);
  } finally {
    loading.value = false;
  }
};

// Next upcoming holiday
const nextHoliday = computed(() => {
  return holidays.value.find(h => h.diff >= 0) || null;
});

// Counts for filter pills
const upcomingCount = computed(() => holidays.value.filter(h => h.status === 'upcoming' || h.status === 'ongoing').length);
const allCount = computed(() => holidays.value.length);
const pastCount = computed(() => holidays.value.filter(h => h.status === 'past').length);

// Filtered holidays based on active segment
const filteredHolidays = computed(() => {
  if (activeFilter.value === 'upcoming') {
    return holidays.value.filter(h => h.status === 'upcoming' || h.status === 'ongoing');
  }
  if (activeFilter.value === 'past') {
    return holidays.value.filter(h => h.status === 'past');
  }
  return holidays.value;
});

const handleStudentChanged = () => {
  fetchData();
};

onIonViewWillEnter(() => {
  fetchData();
});

onMounted(() => {
  fetchData();
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

/* Hero Section */
.vacances-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%);
  border-radius: 22px;
  padding: 22px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(3, 105, 161, 0.3);
  position: relative;
  overflow: hidden;
}

.vacances-hero::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.hero-left {
  flex: 1;
  z-index: 1;
}

.hero-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.hero-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  letter-spacing: -0.3px;
}

.hero-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
  line-height: 1.4;
}

.hero-icon-container {
  width: 58px;
  height: 58px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.hero-emoji {
  font-size: 2.2rem;
}

/* Spotlight Card (Next Upcoming) */
.next-holiday-card {
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
  border: 2px solid #fde68a;
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 22px;
  box-shadow: 0 8px 20px -4px rgba(245, 158, 11, 0.15);
}

.spotlight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.spotlight-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  color: #b45309;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
}

.spotlight-badge ion-icon {
  font-size: 0.95rem;
}

.countdown-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 800;
}

.countdown-chip.urgent-chip {
  background: #fee2e2;
  color: #dc2626;
  animation: pulseUrgent 1.8s infinite;
}

.countdown-chip.upcoming-chip {
  background: #e0f2fe;
  color: #0284c7;
}

@keyframes pulseUrgent {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.spotlight-title {
  margin: 0 0 6px 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.spotlight-desc {
  margin: 0 0 14px 0;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
}

.spotlight-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px dashed #fde68a;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0369a1;
}

.meta-item.duration {
  color: #b45309;
}

/* Filter Segment */
.segment-container {
  display: flex;
  background: #e2e8f0;
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 20px;
  gap: 4px;
}

.seg-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seg-btn.active {
  background: white;
  color: #0284c7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Holidays List */
.holidays-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 30px;
}

.holiday-card {
  display: flex;
  background: white;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: transform 0.15s ease;
}

.holiday-card.past {
  opacity: 0.78;
  background: #fdfdfd;
}

.date-block {
  width: 68px;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 6px;
  flex-shrink: 0;
  border-right: 1px solid #e2e8f0;
}

.date-block.upcoming {
  background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0369a1;
  border-right: none;
}

.date-block.ongoing {
  background: linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
  border-right: none;
}

.date-day {
  font-size: 1.45rem;
  font-weight: 900;
  line-height: 1;
}

.date-month {
  font-size: 0.68rem;
  font-weight: 800;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.holiday-content {
  flex: 1;
  padding: 14px 16px;
  min-width: 0;
}

.holiday-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
}

.status-badge.upcoming {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge.ongoing {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.past {
  background: #f1f5f9;
  color: #64748b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.source-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
}

.holiday-title {
  margin: 0 0 6px 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.holiday-text {
  margin: 0 0 10px 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
}

/* Attachment Section */
.attachment-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0284c7;
  cursor: pointer;
  margin-bottom: 10px;
}

.holiday-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed #f1f5f9;
  margin-top: 6px;
}

.duration-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #b45309;
}

.countdown-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0284c7;
}

/* Loading & Empty */
.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  gap: 15px;
  color: #94a3b8;
}

.empty-card {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
  margin-bottom: 10px;
  display: block;
}
</style>
