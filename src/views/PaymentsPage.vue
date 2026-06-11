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
            <div class="pay-month">{{ formatMonth(pay.month) }}</div>
            <div class="pay-info">
              <h4>{{ pay.amount }} DHS</h4>
              <p>{{ formatDate(pay.date) }}</p>
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
import { ref } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';

const payments = ref<any[]>([]);
const loading = ref(true);

const formatMonth = (m: string) => {
    const months: any = {
        '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
        '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc'
    };
    return months[m] || m;
};

const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR');
};

const fetchPayments = async () => {
    loading.value = true;
    try {
        const students = await apiRequest('/api/school/student', { email: odoo.userConfig?.email });
        const selectedId = odoo.selectedStudentId;
        const studentId = students.find((s: any) => s.id === selectedId)?.id || students[0]?.id;
        
        if (studentId) {
            payments.value = await odoo.getPayments(studentId);
        }
    } catch (e) {
        console.error('Fetch payments failed', e);
    } finally {
        loading.value = false;
    }
};

onIonViewWillEnter(() => {
  fetchPayments();
});
</script>

<style scoped>
.gray-bg { --background: #f8fafc; }
.section-title { margin-bottom: 25px; }
.section-title h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.section-title p { margin: 4px 0 0; color: #94a3b8; font-size: 0.95rem; }

.payments-list { display: flex; flex-direction: column; gap: 15px; }
.payment-item { display: flex; align-items: center; padding: 18px; gap: 15px; background: white; }
.pay-month { width: 55px; height: 55px; background: #f0fdf4; color: #16a34a; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; text-transform: uppercase; }
.pay-info { flex: 1; }
.pay-info h4 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b; }
.pay-info p { margin: 4px 0 0; font-size: 0.85rem; color: #94a3b8; }
.pay-status { padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
.pay-status.paid { background: #dcfce7; color: #16a34a; }
.pay-status.partial { background: #fef9c3; color: #a16207; }
.pay-status.unpaid { background: #fee2e2; color: #ef4444; }

.empty-state-card { background: white; padding: 30px; border-radius: 20px; text-align: center; color: #94a3b8; }
</style>
