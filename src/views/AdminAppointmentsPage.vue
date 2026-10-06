<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/inbox" color="dark"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('appointments.adminTitle') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="loadAdminAppointments">
            <ion-icon :icon="refreshOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding admin-bg">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="fade-in">
        <!-- Hero Header -->
        <div class="admin-hero">
          <div class="hero-left">
            <span class="admin-badge">👔 Administration</span>
            <h2>{{ t('appointments.adminTitle') }}</h2>
            <p>{{ t('appointments.adminSubtitle') }}</p>
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card" :class="{ active: filterStatus === 'all' }" @click="setFilter('all')">
            <span class="stat-num">{{ stats.total }}</span>
            <span class="stat-label">{{ t('appointments.statsTotal') }}</span>
          </div>
          <div class="stat-card stat-pending" :class="{ active: filterStatus === 'pending' }" @click="setFilter('pending')">
            <span class="stat-num">{{ stats.pending }}</span>
            <span class="stat-label">{{ t('appointments.statsPending') }}</span>
          </div>
          <div class="stat-card stat-validated" :class="{ active: filterStatus === 'validated' }" @click="setFilter('validated')">
            <span class="stat-num">{{ stats.validated }}</span>
            <span class="stat-label">{{ t('appointments.statsValidated') }}</span>
          </div>
          <div class="stat-card stat-rescheduled" :class="{ active: filterStatus === 'rescheduled' }" @click="setFilter('rescheduled')">
            <span class="stat-num">{{ stats.rescheduled }}</span>
            <span class="stat-label">{{ t('appointments.statsRescheduled') }}</span>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <ion-searchbar 
            v-model="searchQuery" 
            placeholder="Rechercher parent, élève, motif, date..."
            debounce="300"
            @ionInput="onSearchInput"
            class="custom-searchbar"
          ></ion-searchbar>
        </div>

        <!-- Filter Segment -->
        <div class="filter-segment-wrapper">
          <ion-segment v-model="filterStatus" scrollable mode="md" class="admin-segment" @ionChange="onFilterChanged">
            <ion-segment-button value="all"><ion-label>Tous ({{ stats.total }})</ion-label></ion-segment-button>
            <ion-segment-button value="pending"><ion-label>En attente ({{ stats.pending }})</ion-label></ion-segment-button>
            <ion-segment-button value="validated"><ion-label>Validés ({{ stats.validated }})</ion-label></ion-segment-button>
            <ion-segment-button value="rescheduled"><ion-label>Reprogrammés ({{ stats.rescheduled }})</ion-label></ion-segment-button>
            <ion-segment-button value="completed"><ion-label>Terminés</ion-label></ion-segment-button>
            <ion-segment-button value="rejected"><ion-label>Refusés</ion-label></ion-segment-button>
          </ion-segment>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>{{ t('appointments.loading') }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredAppointments.length === 0" class="empty-state-card">
          <ion-icon :icon="calendarClearOutline" class="empty-icon"></ion-icon>
          <h3>{{ t('appointments.emptyList') }}</h3>
          <p>Aucun rendez-vous ne correspond à vos filtres actuels.</p>
        </div>

        <!-- Appointments List -->
        <div v-else class="admin-cards-list">
          <div 
            v-for="apt in filteredAppointments" 
            :key="apt.id"
            class="admin-apt-card"
            :class="'card-status-' + apt.status"
          >
            <!-- Card Header -->
            <div class="card-top">
              <div class="date-time-box">
                <span class="card-date">📅 {{ formatDate(apt.date) }}</span>
                <span class="card-time">⏰ {{ apt.time_slot }}</span>
              </div>
              <div class="status-pill" :class="'pill-' + apt.status">
                <span>{{ getStatusIcon(apt.status) }}</span>
                <small>{{ getStatusLabel(apt.status) }}</small>
              </div>
            </div>

            <!-- Parent & Student Details -->
            <div class="parties-box">
              <div class="party-item">
                <ion-icon :icon="personOutline" class="party-icon"></ion-icon>
                <div class="party-info">
                  <strong>{{ apt.parent_name || 'Parent d\'élève' }}</strong>
                  <span class="party-sub">Parent de {{ apt.student_name }}</span>
                </div>
              </div>

              <!-- Contact buttons -->
              <div class="contact-actions">
                <a v-if="apt.parent_phone" :href="'tel:' + apt.parent_phone" class="quick-call-btn">
                  <ion-icon :icon="callOutline"></ion-icon>
                  <span>{{ apt.parent_phone }}</span>
                </a>
                <a v-if="apt.parent_phone" :href="'https://wa.me/' + cleanPhone(apt.parent_phone)" target="_blank" class="quick-wa-btn">
                  <ion-icon :icon="logoWhatsapp"></ion-icon>
                </a>
              </div>
            </div>

            <!-- Subject & Note -->
            <div class="content-box">
              <div class="subject-row">
                <span class="type-tag" :class="apt.type">
                  {{ apt.type === 'online' ? '💻 Visioconférence' : '🏫 Présentiel' }}
                </span>
                <h4 class="apt-motif">{{ apt.subject }}</h4>
              </div>
              <p v-if="apt.notes" class="parent-note">
                <span class="note-label">Message parent :</span> "{{ apt.notes }}"
              </p>
            </div>

            <!-- Rescheduled Details (if in rescheduled state) -->
            <div v-if="apt.status === 'rescheduled'" class="rescheduled-preview-box">
              <div class="resched-tag">🔄 Contre-proposition envoyée</div>
              <div class="resched-info">
                📅 <strong>{{ formatDate(apt.proposed_date) }}</strong> à <strong>{{ apt.proposed_time_slot }}</strong>
              </div>
              <p v-if="apt.admin_notes" class="resched-notes">"{{ apt.admin_notes }}"</p>
              <small class="waiting-badge">En attente d'acceptation par le parent</small>
            </div>

            <!-- Validated Location & Consignes -->
            <div v-if="apt.status === 'validated'" class="validated-preview-box">
              <div class="val-line">
                <ion-icon :icon="locationOutline"></ion-icon>
                <span><strong>Lieu :</strong> {{ apt.location || 'Bureau Direction' }}</span>
              </div>
              <div v-if="apt.admin_notes" class="val-line">
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                <span><strong>Consigne :</strong> {{ apt.admin_notes }}</span>
              </div>
            </div>

            <!-- Actions Bar -->
            <div class="actions-bar">
              <!-- If pending -->
              <template v-if="apt.status === 'pending'">
                <ion-button 
                  size="small" 
                  color="success" 
                  class="action-btn"
                  @click="openValidateModal(apt)"
                >
                  <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                  {{ t('appointments.validateBtn') }}
                </ion-button>

                <ion-button 
                  size="small" 
                  color="warning" 
                  fill="outline" 
                  class="action-btn"
                  @click="openRescheduleModal(apt)"
                >
                  <ion-icon :icon="timeOutline" slot="start"></ion-icon>
                  {{ t('appointments.rescheduleBtn') }}
                </ion-button>

                <ion-button 
                  size="small" 
                  color="danger" 
                  fill="clear" 
                  class="action-btn"
                  @click="openRejectModal(apt)"
                >
                  <ion-icon :icon="closeOutline" slot="start"></ion-icon>
                  {{ t('appointments.rejectBtn') }}
                </ion-button>
              </template>

              <!-- If rescheduled -->
              <template v-else-if="apt.status === 'rescheduled'">
                <ion-button 
                  size="small" 
                  color="warning" 
                  fill="outline" 
                  class="action-btn"
                  @click="openRescheduleModal(apt)"
                >
                  <ion-icon :icon="createOutline" slot="start"></ion-icon>
                  Modifier proposition
                </ion-button>
                <ion-button 
                  size="small" 
                  color="danger" 
                  fill="clear" 
                  class="action-btn"
                  @click="openRejectModal(apt)"
                >
                  {{ t('appointments.rejectBtn') }}
                </ion-button>
              </template>

              <!-- If validated -->
              <template v-else-if="apt.status === 'validated'">
                <ion-button 
                  size="small" 
                  color="success" 
                  fill="outline" 
                  class="action-btn"
                  @click="completeAppointment(apt)"
                >
                  <ion-icon :icon="checkmarkDoneOutline" slot="start"></ion-icon>
                  {{ t('appointments.completeBtn') }}
                </ion-button>
                <ion-button 
                  size="small" 
                  color="warning" 
                  fill="clear" 
                  class="action-btn"
                  @click="openRescheduleModal(apt)"
                >
                  Reprogrammer
                </ion-button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 1: VALIDATION DU RENDEZ-VOUS -->
      <ion-modal :is-open="validateModalOpen" @didDismiss="validateModalOpen = false" class="custom-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>✅ Valider le Rendez-vous</h3>
            <ion-button fill="clear" color="dark" @click="validateModalOpen = false">
              <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          <div class="modal-body" v-if="selectedApt">
            <div class="apt-summary-box">
              <p><strong>Élève :</strong> {{ selectedApt.student_name }}</p>
              <p><strong>Parent :</strong> {{ selectedApt.parent_name }}</p>
              <p><strong>Date & Créneau :</strong> {{ formatDate(selectedApt.date) }} à {{ selectedApt.time_slot }}</p>
            </div>

            <div class="modal-form-group">
              <label class="modal-label">Lieu de la rencontre / Lien :</label>
              <input type="text" v-model="validateForm.location" class="modal-input" />
            </div>

            <div class="modal-form-group">
              <label class="modal-label">Instructions / Message pour le parent :</label>
              <textarea v-model="validateForm.admin_notes" rows="3" class="modal-textarea" placeholder="Ex: Merci de vous présenter à l'accueil 5 min avant l'horaire..."></textarea>
            </div>

            <ion-button expand="block" color="success" class="modal-confirm-btn" :disabled="processingAction" @click="confirmValidation">
              <ion-spinner v-if="processingAction" name="crescent"></ion-spinner>
              <span v-else>Confirmer & Bloquer le créneau</span>
            </ion-button>
          </div>
        </div>
      </ion-modal>

      <!-- MODAL 2: PROPOSITION D'UN AUTRE CRÉNEAU (REPROGRAMMATION) -->
      <ion-modal :is-open="rescheduleModalOpen" @didDismiss="rescheduleModalOpen = false" class="custom-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🔄 Proposer un nouveau créneau</h3>
            <ion-button fill="clear" color="dark" @click="rescheduleModalOpen = false">
              <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          <div class="modal-body" v-if="selectedApt">
            <p class="modal-subtext">
              Proposez une date et un créneau alternatif à <strong>{{ selectedApt.parent_name }}</strong> :
            </p>

            <div class="modal-form-group">
              <label class="modal-label">Nouvelle date proposée :</label>
              <input type="date" v-model="rescheduleForm.proposed_date" @change="onRescheduleDateChange" class="modal-input" />
            </div>

            <div class="modal-form-group">
              <label class="modal-label">Créneau horaire libre :</label>
              <div v-if="loadingRescheduleSlots" class="slots-spinner">
                <ion-spinner name="dots" color="primary"></ion-spinner>
              </div>
              <div v-else class="reschedule-slots-grid">
                <button 
                  v-for="slot in rescheduleAvailableSlots" 
                  :key="getSlotTime(slot)"
                  type="button"
                  class="resched-slot-chip"
                  :class="{ 
                    selected: rescheduleForm.proposed_time_slot === getSlotTime(slot),
                    booked: !isSlotAvailable(slot) 
                  }"
                  :disabled="!isSlotAvailable(slot)"
                  @click="rescheduleForm.proposed_time_slot = getSlotTime(slot)"
                >
                  <span>{{ getSlotTime(slot) }}</span>
                  <small>{{ isSlotAvailable(slot) ? 'Libre' : 'Occupé' }}</small>
                </button>
              </div>
            </div>

            <div class="modal-form-group">
              <label class="modal-label">Motif de l'ajustement :</label>
              <textarea v-model="rescheduleForm.admin_notes" rows="2" class="modal-textarea" placeholder="Ex: La direction est en réunion d'inspection le matin..."></textarea>
            </div>

            <ion-button 
              expand="block" 
              color="warning" 
              class="modal-confirm-btn" 
              :disabled="processingAction || !rescheduleForm.proposed_date || !rescheduleForm.proposed_time_slot" 
              @click="confirmReschedule"
            >
              <ion-spinner v-if="processingAction" name="crescent"></ion-spinner>
              <span v-else>Envoyer la proposition au parent</span>
            </ion-button>
          </div>
        </div>
      </ion-modal>

      <!-- MODAL 3: REFUS DU RENDEZ-VOUS -->
      <ion-modal :is-open="rejectModalOpen" @didDismiss="rejectModalOpen = false" class="custom-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>❌ Décliner le Rendez-vous</h3>
            <ion-button fill="clear" color="dark" @click="rejectModalOpen = false">
              <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          <div class="modal-body" v-if="selectedApt">
            <p class="modal-subtext">
              Veuillez indiquer la raison du refus qui sera notifiée à <strong>{{ selectedApt.parent_name }}</strong> :
            </p>

            <div class="modal-form-group">
              <label class="modal-label">Motif du refus :</label>
              <textarea v-model="rejectForm.admin_notes" rows="3" class="modal-textarea" placeholder="Ex: Objet pouvant être traité directement par messagerie ou secrétariat..."></textarea>
            </div>

            <ion-button expand="block" color="danger" class="modal-confirm-btn" :disabled="processingAction" @click="confirmReject">
              <ion-spinner v-if="processingAction" name="crescent"></ion-spinner>
              <span v-else>Confirmer le refus</span>
            </ion-button>
          </div>
        </div>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel, IonSearchbar,
  IonRefresher, IonRefresherContent, IonModal,
  onIonViewWillEnter, toastController, alertController
} from '@ionic/vue';
import {
  refreshOutline, calendarClearOutline, personOutline,
  callOutline, logoWhatsapp, locationOutline, timeOutline,
  checkmarkOutline, closeOutline, createOutline, checkmarkDoneOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { useI18n } from '@/services/translationService';
import { odoo } from '@/services/odoo';

const { t } = useI18n();

const loading = ref(false);
const processingAction = ref(false);
const searchQuery = ref('');
const filterStatus = ref('all');

const appointments = ref<any[]>([]);
const stats = reactive({
  total: 0,
  pending: 0,
  validated: 0,
  rescheduled: 0,
  rejected: 0,
  completed: 0
});

// Selected appointment for modals
const selectedApt = ref<any>(null);

// Modal states
const validateModalOpen = ref(false);
const validateForm = reactive({
  location: 'Bureau de la Direction - Bâtiment Administratif (1er étage)',
  admin_notes: 'Rendez-vous confirmé. Merci de vous présenter à l\'accueil.'
});

const rescheduleModalOpen = ref(false);
const loadingRescheduleSlots = ref(false);
const rescheduleAvailableSlots = ref<{ slot: string; available: boolean }[]>([]);
const rescheduleForm = reactive({
  proposed_date: '',
  proposed_time_slot: '',
  admin_notes: 'La direction a un imprévu sur ce créneau et vous propose cet horaire alternatif.'
});

const rejectModalOpen = ref(false);
const rejectForm = reactive({
  admin_notes: 'La direction ne peut pas donner suite à cette demande pour le moment.'
});

const loadAdminAppointments = async () => {
  loading.value = true;
  try {
    const res = await odoo.getAllAdminAppointments();
    if (res && Array.isArray(res.appointments)) {
      appointments.value = res.appointments;
      if (res.stats) {
        Object.assign(stats, res.stats);
      }
    } else if (Array.isArray(res)) {
      appointments.value = res;
      stats.total = appointments.value.length;
      stats.pending = appointments.value.filter(a => a.status === 'pending').length;
      stats.validated = appointments.value.filter(a => a.status === 'validated').length;
      stats.rescheduled = appointments.value.filter(a => a.status === 'rescheduled').length;
    }
  } catch (e) {
    console.error('Error loading admin appointments:', e);
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await loadAdminAppointments();
  event.target.complete();
};

const setFilter = (status: string) => {
  filterStatus.value = status;
};

const onFilterChanged = () => {
  // handled by computed
};

const onSearchInput = () => {
  // handled by computed
};

const filteredAppointments = computed(() => {
  let list = appointments.value;
  if (filterStatus.value && filterStatus.value !== 'all') {
    list = list.filter(a => a.status === filterStatus.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(a => 
      (a.student_name && a.student_name.toLowerCase().includes(q)) ||
      (a.parent_name && a.parent_name.toLowerCase().includes(q)) ||
      (a.parent_phone && a.parent_phone.includes(q)) ||
      (a.subject && a.subject.toLowerCase().includes(q)) ||
      (a.date && a.date.includes(q)) ||
      (a.time_slot && a.time_slot.includes(q))
    );
  }
  return list;
});

// Modal Openers
const openValidateModal = (apt: any) => {
  selectedApt.value = apt;
  validateForm.location = apt.type === 'online' 
    ? 'Visioconférence Google Meet (Lien envoyé par notification)' 
    : 'Bureau de la Direction - Bâtiment Administratif (1er étage)';
  validateModalOpen.value = true;
};

const confirmValidation = async () => {
  if (!selectedApt.value) return;
  processingAction.value = true;
  try {
    const res = await odoo.adminValidateAppointment(
      selectedApt.value.id,
      validateForm.location,
      validateForm.admin_notes
    );

    if (res && res.success) {
      showToast('Rendez-vous validé avec succès ! Notification envoyée au parent.', 'success');
      validateModalOpen.value = false;
      await loadAdminAppointments();
    } else if (res && res.conflict) {
      const alert = await alertController.create({
        header: '⚠️ Conflit de Planning',
        message: res.message,
        buttons: ['Compris']
      });
      await alert.present();
    } else {
      showToast(res.message || 'Erreur validation', 'danger');
    }
  } catch (e: any) {
    showToast(e.message || 'Erreur validation', 'danger');
  } finally {
    processingAction.value = false;
  }
};

const isSlotAvailable = (slot: any): boolean => {
  if (!slot) return false;
  if (typeof slot.is_available === 'boolean') return slot.is_available;
  if (typeof slot.available === 'boolean') return slot.available;
  return slot.status !== 'validated';
};

const getSlotTime = (slot: any): string => {
  return slot?.time_slot || slot?.slot || '';
};

const openRescheduleModal = async (apt: any) => {
  selectedApt.value = apt;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  rescheduleForm.proposed_date = apt.date || tomorrow.toISOString().split('T')[0];
  rescheduleForm.proposed_time_slot = '';
  rescheduleModalOpen.value = true;
  await loadRescheduleSlots(rescheduleForm.proposed_date);
};

const onRescheduleDateChange = () => {
  rescheduleForm.proposed_time_slot = '';
  loadRescheduleSlots(rescheduleForm.proposed_date);
};

const loadRescheduleSlots = async (dateStr: string) => {
  if (!dateStr) return;
  loadingRescheduleSlots.value = true;
  try {
    const res = await odoo.getAppointmentSlots(dateStr);
    if (res && Array.isArray(res.slots)) {
      rescheduleAvailableSlots.value = res.slots;
    }
  } catch (e) {
    console.warn('Erreur slots reschedule:', e);
  } finally {
    loadingRescheduleSlots.value = false;
  }
};

const confirmReschedule = async () => {
  if (!selectedApt.value || !rescheduleForm.proposed_date || !rescheduleForm.proposed_time_slot) return;
  processingAction.value = true;
  try {
    const res = await odoo.adminRescheduleAppointment(
      selectedApt.value.id,
      rescheduleForm.proposed_date,
      rescheduleForm.proposed_time_slot,
      rescheduleForm.admin_notes
    );

    if (res && res.success) {
      showToast('Nouveau créneau proposé au parent avec succès !', 'success');
      rescheduleModalOpen.value = false;
      await loadAdminAppointments();
    } else if (res && res.conflict) {
      showToast(res.message, 'warning');
    } else {
      showToast(res.message || 'Erreur reprogrammation', 'danger');
    }
  } catch (e: any) {
    showToast(e.message || 'Erreur reprogrammation', 'danger');
  } finally {
    processingAction.value = false;
  }
};

const openRejectModal = (apt: any) => {
  selectedApt.value = apt;
  rejectModalOpen.value = true;
};

const confirmReject = async () => {
  if (!selectedApt.value) return;
  processingAction.value = true;
  try {
    const res = await odoo.adminRejectAppointment(
      selectedApt.value.id,
      rejectForm.admin_notes
    );

    if (res && res.success) {
      showToast('Rendez-vous décliné. Le parent a été notifié.', 'warning');
      rejectModalOpen.value = false;
      await loadAdminAppointments();
    } else {
      showToast(res.message || 'Erreur refus', 'danger');
    }
  } catch (e: any) {
    showToast(e.message || 'Erreur refus', 'danger');
  } finally {
    processingAction.value = false;
  }
};

const completeAppointment = async (apt: any) => {
  try {
    const res = await odoo.adminCompleteAppointment(apt.id);
    if (res && res.success) {
      showToast('Rendez-vous marqué comme terminé.', 'success');
      await loadAdminAppointments();
    }
  } catch (e: any) {
    showToast(e.message || 'Erreur clôture', 'danger');
  }
};

const cleanPhone = (phone: string) => {
  return phone.replace(/[^0-9]/g, '');
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'validated': return 'Validé';
    case 'rescheduled': return 'Contre-proposition';
    case 'rejected': return 'Refusé';
    case 'completed': return 'Terminé';
    case 'cancelled': return 'Annulé parent';
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return '⏳';
    case 'validated': return '✅';
    case 'rescheduled': return '🔄';
    case 'rejected': return '❌';
    case 'completed': return '🏁';
    case 'cancelled': return '🚫';
    default: return '📌';
  }
};

const showToast = async (message: string, color: 'success' | 'warning' | 'danger') => {
  const toast = await toastController.create({
    message,
    duration: 3500,
    color,
    position: 'top'
  });
  await toast.present();
};

onMounted(() => {
  loadAdminAppointments();
});

onIonViewWillEnter(() => {
  loadAdminAppointments();
});
</script>

<style scoped>
.admin-bg {
  --background: #f1f5f9;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Admin Hero */
.admin-hero {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 22px;
  border-radius: 20px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4);
}

.admin-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.admin-hero h2 {
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: white;
}

.admin-hero p {
  font-size: 0.85rem;
  margin: 0;
  opacity: 0.85;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 12px 6px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.2s;
}

.stat-card.active {
  border-color: #0284c7;
  background: #f0f9ff;
}

.stat-num {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.stat-pending .stat-num { color: #0284c7; }
.stat-validated .stat-num { color: #10b981; }
.stat-rescheduled .stat-num { color: #f59e0b; }

/* Search & Segment */
.search-container {
  margin-bottom: 10px;
}

.custom-searchbar {
  --background: #ffffff;
  --border-radius: 14px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 0;
}

.filter-segment-wrapper {
  margin-bottom: 16px;
  overflow-x: auto;
}

.admin-segment {
  background: #e2e8f0;
  border-radius: 12px;
  padding: 3px;
}

.admin-segment ion-segment-button {
  --color-checked: #ffffff;
  --indicator-color: #0f172a;
  font-size: 0.78rem;
  font-weight: 600;
  min-height: 34px;
}

/* Admin Cards List */
.admin-cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-apt-card {
  background: white;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  border-left: 5px solid #94a3b8;
}

.card-status-pending { border-left-color: #0284c7; }
.card-status-validated { border-left-color: #10b981; }
.card-status-rescheduled { border-left-color: #f59e0b; }
.card-status-rejected { border-left-color: #ef4444; }
.card-status-completed { border-left-color: #64748b; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.date-time-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-date {
  font-weight: 700;
  font-size: 0.88rem;
  color: #1e293b;
}

.card-time {
  background: #f0f9ff;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.74rem;
  font-weight: 700;
}

.pill-pending { background: #e0f2fe; color: #0369a1; }
.pill-validated { background: #d1fae5; color: #065f46; }
.pill-rescheduled { background: #fef3c7; color: #92400e; }
.pill-rejected { background: #fee2e2; color: #991b1b; }
.pill-completed { background: #f1f5f9; color: #475569; }

/* Parties Box */
.parties-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.party-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.party-icon {
  font-size: 24px;
  color: #0284c7;
}

.party-info strong {
  display: block;
  font-size: 0.92rem;
  color: #0f172a;
}

.party-sub {
  display: block;
  font-size: 0.76rem;
  color: #64748b;
}

.contact-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-call-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #e0f2fe;
  color: #0284c7;
  padding: 6px 10px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 700;
}

.quick-wa-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #25d366;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 18px;
}

/* Content Box */
.content-box {
  margin-bottom: 12px;
}

.subject-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.type-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: #e2e8f0;
  color: #334155;
}

.apt-motif {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.parent-note {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.note-label {
  font-weight: 600;
  color: #475569;
}

/* Previews */
.rescheduled-preview-box {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.resched-tag {
  font-size: 0.78rem;
  font-weight: 700;
  color: #b45309;
  margin-bottom: 4px;
}

.resched-info {
  font-size: 0.88rem;
  color: #78350f;
}

.resched-notes {
  font-size: 0.8rem;
  color: #92400e;
  margin: 4px 0;
}

.waiting-badge {
  font-size: 0.72rem;
  color: #b45309;
  font-style: italic;
}

.validated-preview-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.val-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #166534;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  gap: 8px;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
  flex-wrap: wrap;
}

.action-btn {
  --border-radius: 10px;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Modals */
.custom-modal {
  --border-radius: 20px;
}

.modal-content {
  padding: 20px;
  background: white;
  height: 100%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}

.modal-subtext {
  font-size: 0.88rem;
  color: #475569;
  margin-bottom: 16px;
}

.apt-summary-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 0.85rem;
}

.apt-summary-box p {
  margin: 4px 0;
  color: #334155;
}

.modal-form-group {
  margin-bottom: 16px;
}

.modal-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.modal-input, .modal-textarea {
  width: 100%;
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
}

.modal-input:focus, .modal-textarea:focus {
  border-color: #0284c7;
  background: white;
}

.reschedule-slots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.resched-slot-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.resched-slot-chip.selected {
  background: #0284c7;
  color: white;
  border-color: #0284c7;
}

.resched-slot-chip.booked,
.resched-slot-chip:disabled {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.resched-slot-chip.booked span {
  color: #94a3b8 !important;
  text-decoration: line-through;
}

.resched-slot-chip.booked small {
  color: #ef4444 !important;
  font-weight: 600;
}

.modal-confirm-btn {
  --border-radius: 12px;
  font-weight: 700;
  margin-top: 20px;
  height: 44px;
}

.empty-state-card {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 20px;
}

.empty-icon {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.empty-state-card h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.empty-state-card p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.loading-center {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}
</style>
