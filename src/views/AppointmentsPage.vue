<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t('appointments.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Clean Hero Banner -->
        <div class="page-hero-clean">
          <div class="hero-icon-box">
            <span class="hero-icon">📅</span>
          </div>
          <div class="hero-text">
            <h1>{{ t('appointments.title') }}</h1>
            <p>{{ t('appointments.subtitle') }}</p>
          </div>
        </div>

        <!-- Segment Switcher -->
        <div class="segment-container">
          <ion-segment v-model="activeTab" mode="ios" class="custom-segment">
            <ion-segment-button value="book">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <ion-label>{{ t('appointments.bookTab') }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="list">
              <ion-icon :icon="listOutline"></ion-icon>
              <ion-label>
                {{ t('appointments.myAppointmentsTab') }}
                <span v-if="appointments.length > 0" class="tab-badge">{{ appointments.length }}</span>
              </ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- TAB 1: PRENDRE RENDEZ-VOUS -->
        <div v-if="activeTab === 'book'" class="tab-content">
          <div class="form-card">
            <!-- Student Selection (if parent has multiple children) -->
            <div v-if="students.length > 1" class="form-group">
              <label class="form-label">
                <ion-icon :icon="personOutline"></ion-icon>
                {{ t('appointments.selectChild') }}
              </label>
              <ion-select v-model="form.student_id" interface="action-sheet" class="custom-select">
                <ion-select-option v-for="std in students" :key="std.id" :value="std.id">
                  {{ std.name }} ({{ std.level_id ? std.level_id[1] : '' }})
                </ion-select-option>
              </ion-select>
            </div>

            <!-- Date Selection -->
            <div class="form-group">
              <label class="form-label">
                <ion-icon :icon="calendarClearOutline"></ion-icon>
                {{ t('appointments.selectDate') }}
              </label>
              <div class="date-input-wrapper">
                <input 
                  type="date" 
                  v-model="form.date" 
                  :min="minSelectableDate" 
                  @change="onDateChanged"
                  class="native-date-input"
                />
              </div>
            </div>

            <!-- Time Slots Grid -->
            <div class="form-group">
              <div class="slots-header">
                <label class="form-label mb-0">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  {{ t('appointments.selectSlot') }}
                </label>
                <div v-if="loadingSlots" class="slots-spinner">
                  <ion-spinner name="dots" color="primary"></ion-spinner>
                </div>
              </div>

              <div v-if="availableSlots.length === 0 && !loadingSlots" class="no-slots-alert">
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                <span>{{ t('appointments.emptySlots') }}</span>
              </div>

              <div v-else class="slots-grid">
                <button 
                  v-for="slot in availableSlots" 
                  :key="getSlotTime(slot)"
                  type="button"
                  class="slot-chip"
                  :class="{
                    'slot-selected': form.time_slot === getSlotTime(slot),
                    'slot-booked': !isSlotAvailable(slot)
                  }"
                  :disabled="!isSlotAvailable(slot)"
                  @click="selectSlot(slot)"
                >
                  <div class="slot-time">{{ getSlotTime(slot) }}</div>
                  <div class="slot-status-tag">
                    <span v-if="form.time_slot === getSlotTime(slot)" class="status-dot dot-selected"></span>
                    <span v-else-if="isSlotAvailable(slot)" class="status-dot dot-available"></span>
                    <span v-else class="status-dot dot-booked"></span>
                    <small>{{ form.time_slot === getSlotTime(slot) ? t('appointments.slotSelected') : (isSlotAvailable(slot) ? t('appointments.slotAvailable') : t('appointments.slotBooked')) }}</small>
                  </div>
                </button>
              </div>
            </div>

            <!-- Meeting Type -->
            <div class="form-group">
              <label class="form-label">
                <ion-icon :icon="businessOutline"></ion-icon>
                {{ t('appointments.meetingType') }}
              </label>
              <div class="type-selector-grid">
                <button 
                  type="button" 
                  class="type-btn" 
                  :class="{ active: form.type === 'in_person' }"
                  @click="form.type = 'in_person'"
                >
                  <span class="type-icon">🏫</span>
                  <div class="type-text">
                    <strong>{{ t('appointments.inPerson') }}</strong>
                    <small>Direction de l'école</small>
                  </div>
                </button>
                <button 
                  type="button" 
                  class="type-btn" 
                  :class="{ active: form.type === 'online' }"
                  @click="form.type = 'online'"
                >
                  <span class="type-icon">💻</span>
                  <div class="type-text">
                    <strong>{{ t('appointments.online') }}</strong>
                    <small>Visioconférence Meet</small>
                  </div>
                </button>
              </div>
            </div>

            <!-- Subject / Motif -->
            <div class="form-group">
              <label class="form-label">
                <ion-icon :icon="chatboxEllipsesOutline"></ion-icon>
                {{ t('appointments.subject') }}
              </label>
              <div class="subject-chips">
                <button 
                  v-for="sub in quickSubjects" 
                  :key="sub"
                  type="button"
                  class="subject-chip"
                  :class="{ active: form.subject === sub }"
                  @click="form.subject = sub"
                >
                  {{ sub }}
                </button>
              </div>
              <input 
                type="text" 
                v-model="form.subject" 
                :placeholder="t('appointments.subjectPlaceholder')"
                class="custom-input"
              />
            </div>

            <!-- Notes / Details -->
            <div class="form-group">
              <label class="form-label">
                <ion-icon :icon="documentTextOutline"></ion-icon>
                {{ t('appointments.notes') }}
              </label>
              <textarea 
                v-model="form.notes" 
                rows="3" 
                :placeholder="t('appointments.notesPlaceholder')"
                class="custom-textarea"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <ion-button 
              expand="block" 
              class="submit-btn" 
              :disabled="submitting || !form.date || !form.time_slot"
              @click="submitAppointmentRequest"
            >
              <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
              <span v-else>
                <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
                {{ t('appointments.submitBtn') }}
              </span>
            </ion-button>
          </div>
        </div>

        <!-- TAB 2: MES RENDEZ-VOUS -->
        <div v-else class="tab-content">
          <div v-if="loadingList" class="loading-center">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>{{ t('appointments.loading') }}</p>
          </div>

          <div v-else-if="appointments.length === 0" class="empty-state-card">
            <div class="empty-icon-circle">
              <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
            </div>
            <h3>{{ t('appointments.emptyList') }}</h3>
            <p>Vous n'avez aucune demande de rendez-vous enregistrée.</p>
            <ion-button fill="outline" size="small" @click="activeTab = 'book'">
              {{ t('appointments.bookTab') }}
            </ion-button>
          </div>

          <div v-else class="appointments-list">
            <div 
              v-for="apt in appointments" 
              :key="apt.id"
              class="apt-card"
              :class="'status-' + apt.status"
            >
              <!-- Card Header -->
              <div class="apt-header">
                <div class="apt-date-badge">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  <span>{{ formatDate(apt.date) }}</span>
                  <span class="apt-time">⏰ {{ apt.time_slot }}</span>
                </div>
                <div class="apt-status-chip" :class="'chip-' + apt.status">
                  <span>{{ getStatusIcon(apt.status) }}</span>
                  <small>{{ getStatusLabel(apt.status) }}</small>
                </div>
              </div>

              <!-- Card Body -->
              <div class="apt-body">
                <h3 class="apt-subject">{{ apt.subject || 'Rendez-vous Direction' }}</h3>
                <div class="apt-student">
                  <ion-icon :icon="personOutline"></ion-icon>
                  <span>{{ apt.student_name }}</span>
                  <span class="apt-type-tag">
                    {{ apt.type === 'online' ? '💻 Visioconférence' : '🏫 Présentiel' }}
                  </span>
                </div>

                <p v-if="apt.notes" class="apt-notes">
                  <strong>Notes :</strong> {{ apt.notes }}
                </p>

                <!-- PROPOSAL BANNER (If Direction proposed another date) -->
                <div v-if="apt.status === 'rescheduled'" class="proposal-banner">
                  <div class="proposal-header">
                    <span class="proposal-icon">🔄</span>
                    <strong>{{ t('appointments.proposalBanner') }}</strong>
                  </div>
                  <div class="proposal-details">
                    <div class="prop-slot">
                      📅 <strong>{{ formatDate(apt.proposed_date) }}</strong> à <strong>{{ apt.proposed_time_slot }}</strong>
                    </div>
                    <p v-if="apt.admin_notes" class="prop-notes">
                      <em>"{{ apt.admin_notes }}"</em>
                    </p>
                  </div>
                  <div class="proposal-actions">
                    <ion-button 
                      size="small" 
                      color="success" 
                      class="accept-prop-btn"
                      :disabled="acceptingId === apt.id"
                      @click="acceptProposal(apt)"
                    >
                      <ion-spinner v-if="acceptingId === apt.id" name="crescent"></ion-spinner>
                      <span v-else>
                        <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                        {{ t('appointments.acceptProposalBtn') }}
                      </span>
                    </ion-button>
                    <ion-button 
                      size="small" 
                      fill="outline" 
                      color="danger"
                      @click="promptCancelAppointment(apt)"
                    >
                      <ion-icon :icon="closeOutline" slot="start"></ion-icon>
                      {{ t('appointments.cancelBtn') }}
                    </ion-button>
                  </div>
                </div>

                <!-- VALIDATED INFO -->
                <div v-if="apt.status === 'validated'" class="validated-info">
                  <div class="val-item">
                    <ion-icon :icon="locationOutline"></ion-icon>
                    <span><strong>Lieu :</strong> {{ apt.location || 'Bureau de la Direction' }}</span>
                  </div>
                  <div v-if="apt.admin_notes" class="val-item">
                    <ion-icon :icon="informationCircleOutline"></ion-icon>
                    <span><strong>Consigne :</strong> {{ apt.admin_notes }}</span>
                  </div>
                </div>

                <!-- REJECTED INFO -->
                <div v-if="apt.status === 'rejected' && apt.admin_notes" class="rejected-info">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  <span><strong>Motif de la direction :</strong> {{ apt.admin_notes }}</span>
                </div>
              </div>

              <!-- Card Footer / Actions -->
              <div v-if="apt.status === 'pending' || apt.status === 'validated'" class="apt-footer">
                <ion-button 
                  fill="clear" 
                  color="danger" 
                  size="small" 
                  class="cancel-link-btn"
                  @click="promptCancelAppointment(apt)"
                >
                  <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                  {{ t('appointments.cancelBtn') }}
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
import { ref, reactive, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
  IonButton, IonSegment, IonSegmentButton, IonLabel,
  IonSelect, IonSelectOption, IonRefresher, IonRefresherContent,
  onIonViewWillEnter, toastController, alertController
} from '@ionic/vue';
import {
  calendarOutline, calendarClearOutline, listOutline,
  personOutline, timeOutline, businessOutline,
  chatboxEllipsesOutline, documentTextOutline,
  checkmarkCircleOutline, checkmarkOutline, closeOutline,
  informationCircleOutline, locationOutline, alertCircleOutline,
  trashOutline
} from 'ionicons/icons';
import { useI18n } from '@/services/translationService';
import { odoo } from '@/services/odoo';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t } = useI18n();

const activeTab = ref<'book' | 'list'>('book');
const loadingList = ref(false);
const loadingSlots = ref(false);
const submitting = ref(false);
const acceptingId = ref<number | null>(null);

const students = ref<any[]>([]);
const appointments = ref<any[]>([]);
const availableSlots = ref<{ slot: string; available: boolean }[]>([]);

const quickSubjects = [
  'Suivi pédagogique & Résultats',
  'Comportement & Vie scolaire',
  'Orientation scolaire',
  'Demande administrative',
  'Réclamation & Échange'
];

// Calculate tomorrow's date string for input min attribute (YYYY-MM-DD)
const getTomorrowDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const minSelectableDate = ref(getTomorrowDateStr());

const form = reactive({
  student_id: null as number | null,
  student_name: '',
  date: getTomorrowDateStr(),
  time_slot: '',
  type: 'in_person',
  subject: 'Suivi pédagogique & Résultats',
  notes: ''
});

const loadInitialData = async () => {
  try {
    const parentUserStr = localStorage.getItem('parent_user');
    const parentUser = parentUserStr ? JSON.parse(parentUserStr) : {};

    // Get current student
    const activeStudentId = odoo.selectedStudentId;
    if (activeStudentId) {
      form.student_id = activeStudentId;
    }

    // Try to load students of parent
    try {
      const parentData = await odoo.getParentData();
      if (parentData && Array.isArray(parentData.children)) {
        students.value = parentData.children;
        const currentStd = students.value.find((s: any) => s.id === activeStudentId);
        if (currentStd) {
          form.student_name = currentStd.name;
        }
      }
    } catch (e) {
      console.warn('Could not load parent children:', e);
    }

    await loadSlotsForDate(form.date);
    await loadAppointmentsList();
  } catch (e) {
    console.error('Error in loadInitialData:', e);
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

const loadSlotsForDate = async (dateStr: string) => {
  if (!dateStr) return;
  loadingSlots.value = true;
  try {
    const res = await odoo.getAppointmentSlots(dateStr);
    if (res && Array.isArray(res.slots)) {
      availableSlots.value = res.slots;
      // If previously selected slot is no longer available, reset
      if (form.time_slot) {
        const matching = availableSlots.value.find(s => getSlotTime(s) === form.time_slot);
        if (!matching || !isSlotAvailable(matching)) {
          form.time_slot = '';
        }
      }
    } else {
      // Default slots fallback
      availableSlots.value = [
        { time_slot: '09:00 - 09:30', is_available: true },
        { time_slot: '09:30 - 10:00', is_available: true },
        { time_slot: '10:00 - 10:30', is_available: true },
        { time_slot: '10:30 - 11:00', is_available: true },
        { time_slot: '11:00 - 11:30', is_available: true },
        { time_slot: '14:00 - 14:30', is_available: true },
        { time_slot: '14:30 - 15:00', is_available: true },
        { time_slot: '15:00 - 15:30', is_available: true },
        { time_slot: '15:30 - 16:00', is_available: true },
        { time_slot: '16:00 - 16:30', is_available: true }
      ];
    }
  } catch (e) {
    console.warn('Erreur slots appointments:', e);
  } finally {
    loadingSlots.value = false;
  }
};

const onDateChanged = () => {
  form.time_slot = '';
  loadSlotsForDate(form.date);
};

const selectSlot = (slotObj: any) => {
  if (isSlotAvailable(slotObj)) {
    form.time_slot = getSlotTime(slotObj);
  }
};

const loadAppointmentsList = async () => {
  loadingList.value = true;
  try {
    const activeStudentId = odoo.selectedStudentId || form.student_id;
    const res = await odoo.getAppointments(activeStudentId || undefined);
    if (Array.isArray(res)) {
      appointments.value = res;
    } else if (res && Array.isArray(res.appointments)) {
      appointments.value = res.appointments;
    } else {
      appointments.value = [];
    }
  } catch (e) {
    console.error('Error fetching appointments:', e);
  } finally {
    loadingList.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await Promise.all([
    loadSlotsForDate(form.date),
    loadAppointmentsList()
  ]);
  event.target.complete();
};

const submitAppointmentRequest = async () => {
  if (!form.date || !form.time_slot) {
    showToast('Veuillez sélectionner une date et un créneau horaire.', 'warning');
    return;
  }

  submitting.value = true;
  try {
    const parentUserStr = localStorage.getItem('parent_user');
    const parentUser = parentUserStr ? JSON.parse(parentUserStr) : {};

    const student = students.value.find(s => s.id === form.student_id);
    const studentName = student ? student.name : form.student_name || 'Élève';

    const payload = {
      student_id: form.student_id || odoo.selectedStudentId,
      student_name: studentName,
      parent_id: parentUser.id || undefined,
      parent_name: parentUser.name || 'Parent d\'élève',
      parent_phone: parentUser.phone || '',
      parent_email: parentUser.email || '',
      date: form.date,
      time_slot: form.time_slot,
      subject: form.subject,
      type: form.type,
      notes: form.notes
    };

    const res = await odoo.requestAppointment(payload);

    if (res && res.success) {
      showToast(t('appointments.requestSuccess'), 'success');
      form.notes = '';
      form.time_slot = '';
      await loadAppointmentsList();
      activeTab.value = 'list';
    } else if (res && res.conflict) {
      const alert = await alertController.create({
        header: t('appointments.conflictTitle'),
        message: res.message || t('appointments.conflictMsg'),
        buttons: ['OK']
      });
      await alert.present();
      await loadSlotsForDate(form.date);
    } else {
      showToast(res.message || 'Erreur lors de la prise de rendez-vous', 'danger');
    }
  } catch (e: any) {
    console.error('Submit error:', e);
    showToast(e.message || 'Erreur lors de la demande de rendez-vous', 'danger');
  } finally {
    submitting.value = false;
  }
};

const acceptProposal = async (apt: any) => {
  acceptingId.value = apt.id;
  try {
    const res = await odoo.acceptAppointmentProposal(apt.id, apt.student_id);
    if (res && res.success) {
      showToast(t('appointments.proposalAcceptedSuccess'), 'success');
      await loadAppointmentsList();
    } else if (res && res.conflict) {
      showToast(res.message, 'warning');
      await loadAppointmentsList();
    } else {
      showToast(res.message || 'Erreur lors de l\'acceptation', 'danger');
    }
  } catch (e: any) {
    showToast(e.message || 'Erreur acceptation proposition', 'danger');
  } finally {
    acceptingId.value = null;
  }
};

const promptCancelAppointment = async (apt: any) => {
  const alert = await alertController.create({
    header: t('appointments.cancelBtn'),
    message: t('appointments.confirmCancel'),
    buttons: [
      { text: 'Non', role: 'cancel' },
      {
        text: 'Oui, annuler',
        role: 'destructive',
        handler: async () => {
          try {
            const res = await odoo.cancelAppointment(apt.id);
            if (res && res.success) {
              showToast(t('appointments.cancelledSuccess'), 'success');
              await loadAppointmentsList();
              await loadSlotsForDate(form.date);
            }
          } catch (e: any) {
            showToast(e.message || 'Erreur annulation', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
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
    case 'pending': return t('appointments.statusPending');
    case 'validated': return t('appointments.statusValidated');
    case 'rescheduled': return t('appointments.statusRescheduled');
    case 'rejected': return t('appointments.statusRejected');
    case 'completed': return t('appointments.statusCompleted');
    case 'cancelled': return t('appointments.statusCancelled');
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
  loadInitialData();
});

onIonViewWillEnter(() => {
  loadInitialData();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Page Hero Banner */
.page-hero-clean {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.3);
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-icon {
  font-size: 26px;
}

.hero-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: white;
}

.hero-text p {
  font-size: 0.85rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.3;
}

/* Custom Segment */
.segment-container {
  margin-bottom: 20px;
}

.custom-segment {
  background: #e2e8f0;
  border-radius: 14px;
  padding: 4px;
}

.custom-segment ion-segment-button {
  --indicator-color: #0284c7;
  --color-checked: #ffffff;
  --color: #64748b;
  font-weight: 600;
  font-size: 0.88rem;
  min-height: 40px;
  border-radius: 10px;
}

.tab-badge {
  background: rgba(2, 132, 199, 0.2);
  color: #0284c7;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 10px;
  margin-left: 6px;
}

.custom-segment ion-segment-button.segment-button-checked .tab-badge {
  background: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

/* Form Card */
.form-card {
  background: white;
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf2f7;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.form-label ion-icon {
  font-size: 18px;
  color: #0284c7;
}

.date-input-wrapper {
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  transition: all 0.2s;
}

.date-input-wrapper:focus-within {
  border-color: #0284c7;
  background: #ffffff;
}

.native-date-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  outline: none;
}

/* Slots Grid */
.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (min-width: 480px) {
  .slots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.slot-chip {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.slot-chip:hover:not(:disabled) {
  border-color: #38bdf8;
  background: #f0f9ff;
}

.slot-selected {
  background: #0284c7 !important;
  border-color: #0284c7 !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.slot-chip:disabled,
.slot-booked {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}

.slot-booked .slot-time {
  color: #94a3b8 !important;
  text-decoration: line-through;
}

.slot-booked .slot-status-tag {
  color: #ef4444 !important;
  font-weight: 600;
}

.slot-time {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
}

.slot-selected .slot-time {
  color: #ffffff;
}

.slot-status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #64748b;
}

.slot-selected .slot-status-tag {
  color: rgba(255, 255, 255, 0.9);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-available { background: #10b981; }
.dot-booked { background: #ef4444; }
.dot-selected { background: #ffffff; }

.no-slots-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 10px;
  color: #b45309;
  font-size: 0.85rem;
}

/* Meeting Type Selector */
.type-selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  background: #f0f9ff;
  border-color: #0284c7;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
}

.type-icon {
  font-size: 22px;
}

.type-text strong {
  display: block;
  font-size: 0.86rem;
  color: #1e293b;
}

.type-text small {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
}

/* Subject Chips & Inputs */
.subject-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.subject-chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 0.76rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-chip.active {
  background: #0284c7;
  color: white;
  border-color: #0284c7;
}

.custom-input, .custom-textarea {
  width: 100%;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
  transition: all 0.2s;
}

.custom-input:focus, .custom-textarea:focus {
  border-color: #0284c7;
  background: #ffffff;
}

.submit-btn {
  --background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  --border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  margin-top: 10px;
  height: 48px;
}

/* Tab 2: Appointments List */
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apt-card {
  background: white;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf2f7;
  border-left: 5px solid #94a3b8;
  position: relative;
  overflow: hidden;
}

.apt-card.status-validated { border-left-color: #10b981; }
.apt-card.status-rescheduled { border-left-color: #f59e0b; }
.apt-card.status-pending { border-left-color: #0284c7; }
.apt-card.status-rejected { border-left-color: #ef4444; }
.apt-card.status-completed { border-left-color: #64748b; }
.apt-card.status-cancelled { border-left-color: #cbd5e1; }

.apt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.apt-date-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.apt-time {
  color: #0284c7;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
}

.apt-status-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.chip-pending { background: #e0f2fe; color: #0369a1; }
.chip-validated { background: #d1fae5; color: #065f46; }
.chip-rescheduled { background: #fef3c7; color: #92400e; }
.chip-rejected { background: #fee2e2; color: #991b1b; }
.chip-completed { background: #f1f5f9; color: #475569; }
.chip-cancelled { background: #f1f5f9; color: #94a3b8; }

.apt-subject {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.apt-student {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #475569;
  margin-bottom: 10px;
}

.apt-type-tag {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
}

.apt-notes {
  font-size: 0.82rem;
  color: #64748b;
  margin: 6px 0 10px 0;
  line-height: 1.4;
}

/* Proposal Banner */
.proposal-banner {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1.5px solid #fde68a;
  border-radius: 14px;
  padding: 14px;
  margin: 12px 0;
}

.proposal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #92400e;
  font-size: 0.88rem;
  margin-bottom: 8px;
}

.proposal-details {
  margin-bottom: 10px;
}

.prop-slot {
  font-size: 0.95rem;
  color: #78350f;
  margin-bottom: 4px;
}

.prop-notes {
  font-size: 0.82rem;
  color: #92400e;
  margin: 0;
}

.proposal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.accept-prop-btn {
  --border-radius: 10px;
  font-weight: 700;
}

/* Validated & Rejected Info */
.validated-info {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.val-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #166534;
}

.val-item ion-icon {
  font-size: 16px;
}

.rejected-info {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #991b1b;
}

.apt-footer {
  border-top: 1px solid #f1f5f9;
  margin-top: 12px;
  padding-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.cancel-link-btn {
  font-size: 0.8rem;
}

/* Empty State */
.empty-state-card {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.empty-icon-circle {
  width: 70px;
  height: 70px;
  background: #f0f9ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
}

.empty-icon {
  font-size: 32px;
  color: #0284c7;
}

.empty-state-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.empty-state-card p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 16px 0;
}

.loading-center {
  text-align: center;
  padding: 50px 20px;
  color: #64748b;
}
</style>
