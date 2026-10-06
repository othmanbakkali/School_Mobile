<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Paiements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <div class="section-title">
          <h2>💰 Historique des Paiements</h2>
          <p>Suivi de vos frais de scolarité</p>
        </div>

        <div v-if="loading" class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <div v-else-if="payments.length === 0" class="empty-state-card">
          <p>Aucun paiement enregistré pour l'année en cours.</p>
        </div>

        <div v-else class="payments-list">
          <div v-for="pay in payments" :key="pay.id" class="premium-card payment-item">
            <div class="pay-month" :class="{ 'reg-badge': pay.payment_type === 'registration' }">
              <span class="month-code">{{ pay.payment_type === 'registration' ? 'Inscr' : formatMonthShort(pay.month) }}</span>
              <span class="year-code" v-if="pay.payment_type !== 'registration'">{{ getMonthYear(pay.month).year }}</span>
            </div>
            <div class="pay-info">
              <h4>{{ pay.amount }} DHS</h4>
              <p>
                <span class="pay-type-label">{{ getPaymentLabel(pay) }}</span>
                <span v-if="pay.date"> • {{ formatDate(pay.date) }}</span>
              </p>
            </div>
            <div class="pay-status" :class="pay.state">
              {{ pay.state === 'paid' ? 'Payé' : (pay.state === 'partial' ? 'Partiel' : 'À régler') }}
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
  IonSpinner, IonButtons, IonMenuButton, onIonViewWillEnter
} from '@ionic/vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const payments = ref<any[]>([]);
const loading = ref(true);

// Ordre scolaire strict : Septembre 2026 -> Juin 2027
const monthOrder: Record<string, number> = {
  '09': 1,
  '10': 2,
  '11': 3,
  '12': 4,
  '01': 5,
  '02': 6,
  '03': 7,
  '04': 8,
  '05': 9,
  '06': 10,
  '07': 11,
  '08': 12
};

const getMonthYear = (m: string) => {
  const is2026 = ['09', '10', '11', '12'].includes(m);
  const year = is2026 ? '2026' : '2027';
  const names: Record<string, string> = {
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août'
  };
  const shorts: Record<string, string> = {
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
    '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
    '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août'
  };
  return {
    name: names[m] || m,
    short: shorts[m] || m,
    year
  };
};

const formatMonthShort = (m: string) => {
  return getMonthYear(m).short;
};

const getPaymentLabel = (pay: any) => {
  if (pay.payment_type === 'registration') {
    return "Frais d'inscription (2026-2027)";
  }
  const my = getMonthYear(pay.month);
  return `Scolarité ${my.name} ${my.year}`;
};

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
};

const sortPayments = (list: any[]) => {
  return [...list].sort((a, b) => {
    // Inscription toujours en premier
    if (a.payment_type === 'registration' && b.payment_type !== 'registration') return -1;
    if (b.payment_type === 'registration' && a.payment_type !== 'registration') return 1;

    const ordA = monthOrder[a.month] || 99;
    const ordB = monthOrder[b.month] || 99;
    if (ordA !== ordB) return ordA - ordB;

    return (a.id || 0) - (b.id || 0);
  });
};

const fetchPayments = async () => {
  loading.value = true;
  try {
    const students = await apiRequest('/api/school/student', { email: odoo.userConfig?.email });
    const selectedId = odoo.selectedStudentId;
    const studentId = students.find((s: any) => s.id === selectedId)?.id || students[0]?.id;
    
    if (studentId) {
      const raw = await odoo.getPayments(studentId);
      payments.value = sortPayments(Array.isArray(raw) ? raw : []);
    }
  } catch (e) {
    console.error('Fetch payments failed', e);
  } finally {
    loading.value = false;
  }
};

const handleStudentChanged = () => {
  fetchPayments();
};

onIonViewWillEnter(() => {
  fetchPayments();
});

onMounted(() => {
  fetchPayments();
  window.addEventListener('student-changed', handleStudentChanged);
});

onUnmounted(() => {
  window.removeEventListener('student-changed', handleStudentChanged);
});
</script>

<style scoped>
.gray-bg { --background: #f8fafc; }
.section-title { margin-bottom: 25px; }
.section-title h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.section-title p { margin: 4px 0 0; color: #94a3b8; font-size: 0.95rem; }

.payments-list { display: flex; flex-direction: column; gap: 15px; }
.payment-item { display: flex; align-items: center; padding: 18px; gap: 15px; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04); }
.pay-month { 
  width: 58px; 
  height: 58px; 
  background: #f0fdf4; 
  color: #16a34a; 
  border-radius: 16px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  font-weight: 800; 
  line-height: 1.15;
  box-shadow: inset 0 0 0 1px rgba(22, 163, 74, 0.15);
}
.pay-month .month-code { font-size: 0.95rem; text-transform: uppercase; }
.pay-month .year-code { font-size: 0.68rem; font-weight: 700; opacity: 0.85; margin-top: 1px; }
.pay-month.reg-badge { 
  background: #eff6ff; 
  color: #2563eb; 
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.15);
}
.pay-month.reg-badge .month-code { font-size: 0.82rem; }

.pay-info { flex: 1; }
.pay-info h4 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; }
.pay-info p { margin: 4px 0 0; font-size: 0.85rem; color: #94a3b8; }
.pay-type-label { font-weight: 600; color: #475569; }
.pay-status { padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
.pay-status.paid { background: #dcfce7; color: #16a34a; }
.pay-status.partial { background: #fef9c3; color: #a16207; }
.pay-status.unpaid { background: #fee2e2; color: #ef4444; }

.empty-state-card { background: white; padding: 30px; border-radius: 20px; text-align: center; color: #94a3b8; }
</style>
