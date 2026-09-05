<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Student Wallet</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Balance Card -->
        <div class="premium-card balance-card ion-padding">
          <div class="card-inner">
            <div class="balance-label">
              <span>SOLDE DU PORTEFEUILLE</span>
              <ion-icon :icon="cardOutline"></ion-icon>
            </div>
            <h1 class="balance-amount">{{ formatPrice(balance) }}</h1>
            <p class="balance-status">Actif • Utilisable à la cantine et boutique</p>
            <div class="balance-actions">
              <ion-button expand="block" fill="light" class="refill-btn" @click="openRefillModal" aria-label="Recharger le solde du portefeuille">
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                Recharger le solde
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Transaction History -->
        <div class="section-header">
          <h2>Historique des transactions</h2>
        </div>

        <div v-if="loading" class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement des transactions...</p>
        </div>

        <div v-else-if="transactions.length === 0" class="empty-state-card">
          <ion-icon :icon="swapHorizontalOutline" class="empty-icon"></ion-icon>
          <p>Aucune transaction enregistrée pour le moment.</p>
        </div>

        <div v-else class="transactions-list">
          <div v-for="t in transactions" :key="t.id" class="transaction-item premium-card ion-padding">
            <div class="tx-icon-box" :class="t.type">
              <ion-icon :icon="t.type === 'credit' ? arrowDownOutline : arrowUpOutline"></ion-icon>
            </div>
            <div class="tx-info">
              <h3>{{ t.description }}</h3>
              <p>{{ formatDate(t.date) }}</p>
            </div>
            <div class="tx-amount" :class="t.type">
              {{ t.type === 'credit' ? '+' : '-' }}{{ t.amount.toFixed(2) }} MAD
            </div>
          </div>
        </div>
      </div>

      <!-- Refill Simulation Modal -->
      <ion-modal :is-open="refillModalOpen" @didDismiss="closeRefillModal" class="refill-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar mode="md">
            <ion-title>Recharger le solde</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeRefillModal" color="medium">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding modal-bg">
          <div class="modal-wrapper">
            <h3>Choisissez le montant</h3>
            <div class="amount-presets">
              <div 
                v-for="amt in [50, 100, 200, 500]" 
                :key="amt" 
                class="amount-bubble" 
                :class="{ active: selectedAmount === amt }"
                @click="selectedAmount = amt"
              >
                {{ amt }} MAD
              </div>
            </div>

            <div class="custom-amount-box">
              <label>Autre montant (MAD)</label>
              <input type="number" v-model.number="selectedAmount" class="custom-input" placeholder="Montant personnalisé" />
            </div>

            <!-- Fake Credit Card View -->
            <div class="payment-card-visual">
              <div class="card-chip"></div>
              <div class="card-number">•••• •••• •••• 1234</div>
              <div class="card-bottom">
                <div class="card-holder">PARENT DE L'ÉLÈVE</div>
                <div class="card-expiry">12/28</div>
              </div>
            </div>

            <ion-button expand="block" color="primary" class="submit-refill-btn" @click="handleRefill" :disabled="refilling || !selectedAmount">
              <span v-if="!refilling">Payer {{ selectedAmount || 0 }} MAD</span>
              <ion-spinner name="crescent" color="light" v-else></ion-spinner>
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonMenuButton, IonIcon, IonSpinner, IonButton,
  IonModal, toastController 
} from '@ionic/vue';
import { 
  cardOutline, addOutline, swapHorizontalOutline, arrowDownOutline, arrowUpOutline 
} from 'ionicons/icons';
import { ref, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const loading = ref(true);
const refilling = ref(false);
const balance = ref(150.00);
const transactions = ref<any[]>([]);
const refillModalOpen = ref(false);
const selectedAmount = ref(100);

const formatPrice = (price: number) => {
  return price.toFixed(2) + ' MAD';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

const openRefillModal = () => {
  selectedAmount.value = 100;
  refillModalOpen.value = true;
};

const closeRefillModal = () => {
  refillModalOpen.value = false;
};

const fetchWalletData = async () => {
  loading.value = true;
  const studentId = odoo.selectedStudentId;
  if (!studentId) {
    loading.value = false;
    return;
  }
  try {
    // Refresh student info first to get balance
    const config = odoo.userConfig;
    if (config) {
      const students = await apiRequest('/api/school/student', { email: config.email });
      if (students && students.length > 0) {
        const student = students.find((s: any) => s.id === studentId) || students[0];
        balance.value = student.wallet_balance || 0.00;
      }
    }
    
    // Fetch transactions
    const tx = await apiRequest('/api/school/wallet/transactions', { student_id: studentId });
    transactions.value = tx;
  } catch (error) {
    console.error('Failed to fetch wallet data', error);
  } finally {
    loading.value = false;
  }
};

const handleRefill = async () => {
  const studentId = odoo.selectedStudentId;
  if (!studentId || !selectedAmount.value || selectedAmount.value <= 0) return;
  
  refilling.value = true;
  try {
    const res = await apiRequest('/api/school/wallet/refill', { 
      student_id: studentId, 
      amount: selectedAmount.value 
    });
    
    if (res && res.success) {
      balance.value = res.balance;
      
      const toast = await toastController.create({
        message: `Votre rechargement de ${selectedAmount.value} MAD a été effectué !`,
        duration: 3000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
      
      closeRefillModal();
      fetchWalletData();
    }
  } catch (error) {
    console.error('Refill error', error);
    const toast = await toastController.create({
      message: "Erreur lors du traitement du paiement.",
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    refilling.value = false;
  }
};

const handleStudentChanged = () => {
  fetchWalletData();
};

onMounted(() => {
  fetchWalletData();
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

.modal-bg {
  --background: #ffffff;
}

.premium-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  border: 1px solid rgba(0,0,0,0.02);
  transition: transform 0.25s ease;
  animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.premium-card:active {
  transform: scale(0.98);
}

.balance-card {
  background: linear-gradient(135deg, #5c2d54 0%, #3b0764 45%, #1e1b4b 100%);
  color: white;
  margin-top: 10px;
  box-shadow: 0 20px 45px -12px rgba(92, 45, 84, 0.35);
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.balance-card::before {
  content: '';
  position: absolute;
  top: -30%;
  left: -20%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(168, 85, 247, 0) 70%);
  border-radius: 50%;
  filter: blur(20px);
  pointer-events: none;
}

.balance-card::after {
  content: '';
  position: absolute;
  bottom: -40%;
  right: -10%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(92, 45, 84, 0.45) 0%, rgba(92, 45, 84, 0) 70%);
  border-radius: 50%;
  filter: blur(25px);
  pointer-events: none;
}

.balance-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0.8;
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 1.2px;
  position: relative;
  z-index: 2;
}

.balance-label ion-icon {
  font-size: 1.35rem;
  color: rgba(255,255,255,0.9);
}

.balance-amount {
  font-size: 2.35rem;
  font-weight: 855;
  margin: 18px 0 8px 0;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.balance-status {
  font-size: 0.78rem;
  opacity: 0.7;
  margin: 0 0 22px 0;
  font-weight: 600;
  position: relative;
  z-index: 2;
}

.refill-btn {
  --background: #ffffff;
  --color: #5c2d54;
  --border-radius: 16px;
  font-weight: 800;
  height: 50px;
  margin: 0;
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  position: relative;
  z-index: 2;
}

.refill-btn:active {
  transform: scale(0.97);
}

.section-header {
  margin: 30px 4px 16px 4px;
}

.section-header h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.4px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 0;
  animation: floatIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.tx-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.tx-icon-box.credit {
  background: #dcfce7;
  color: #15803d;
}

.tx-icon-box.debit {
  background: #fee2e2;
  color: #b91c1c;
}

.tx-info {
  flex: 1;
}

.tx-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 750;
  color: #1e293b;
}

.tx-info p {
  margin: 3px 0 0 0;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
}

.tx-amount {
  font-weight: 850;
  font-size: 1rem;
}

.tx-amount.credit {
  color: #15803d;
}

.tx-amount.debit {
  color: #b91c1c;
}

/* Modal styling with glass elements */
.refill-modal {
  --height: 560px;
  --border-radius: 32px;
  --align-items: flex-end;
}

.modal-wrapper {
  padding: 15px 5px;
}

.modal-wrapper h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 16px 0;
}

.amount-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 22px;
}

.amount-bubble {
  background: #f1f5f9;
  border: 2px solid transparent;
  padding: 15px;
  border-radius: 18px;
  text-align: center;
  font-weight: 800;
  color: #475569;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.amount-bubble:active {
  transform: scale(0.95);
}

.amount-bubble.active {
  border-color: #5c2d54;
  background: rgba(92, 45, 84, 0.08);
  color: #5c2d54;
  box-shadow: 0 6px 14px rgba(92, 45, 84, 0.1);
}

.custom-amount-box {
  margin-bottom: 25px;
}

.custom-amount-box label {
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  color: #5c2d54;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  padding: 14px 18px;
  border-radius: 16px;
  outline: none;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e293b;
  transition: border-color 0.25s;
}

.custom-input:focus {
  border-color: #5c2d54;
}

.payment-card-visual {
  background: linear-gradient(135deg, #1e293b 0%, #475569 55%, #64748b 100%);
  color: white;
  padding: 24px;
  border-radius: 22px;
  height: 140px;
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
}

.payment-card-visual::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%);
  transform: skewX(-25deg);
  animation: shine 4s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 200%; }
}

.card-chip {
  width: 36px;
  height: 26px;
  background: #f1f5f9;
  border-radius: 6px;
  opacity: 0.85;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);
}

.card-number {
  font-size: 1.1rem;
  letter-spacing: 2px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  opacity: 0.85;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.submit-refill-btn {
  --border-radius: 18px;
  height: 52px;
  font-weight: 800;
  --background: #5c2d54;
  margin: 0;
  box-shadow: 0 8px 20px rgba(92, 45, 84, 0.2);
}

.empty-state-card {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 24px;
  color: #94a3b8;
  border: 1px solid rgba(0,0,0,0.02);
}

.empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
  margin-bottom: 12px;
  display: block;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #64748b;
}

/* Animations */
@keyframes floatIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
