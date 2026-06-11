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
              <ion-button expand="block" fill="light" class="refill-btn" @click="openRefillModal">
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
import { ref, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';

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

onMounted(() => {
  fetchWalletData();
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
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
}

.balance-card {
  background: linear-gradient(135deg, #5c2d54 0%, #3a1934 100%);
  color: white;
  margin-top: 10px;
  box-shadow: 0 8px 25px rgba(92, 45, 84, 0.25);
  border-radius: 24px;
}

.balance-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0.7;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.balance-label ion-icon {
  font-size: 1.2rem;
}

.balance-amount {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 15px 0 5px 0;
  letter-spacing: -0.5px;
}

.balance-status {
  font-size: 0.75rem;
  opacity: 0.65;
  margin: 0 0 20px 0;
  font-weight: 500;
}

.refill-btn {
  --background: #ffffff;
  --color: #5c2d54;
  --border-radius: 14px;
  font-weight: 700;
  height: 48px;
  margin: 0;
}

.section-header {
  margin: 25px 5px 15px 5px;
}

.section-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 14px 18px;
  margin-bottom: 0;
}

.tx-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.tx-icon-box.credit {
  background: #dcfce7;
  color: #16a34a;
}

.tx-icon-box.debit {
  background: #fee2e2;
  color: #ef4444;
}

.tx-info {
  flex: 1;
}

.tx-info h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.tx-info p {
  margin: 2px 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.tx-amount {
  font-weight: 800;
  font-size: 0.95rem;
}

.tx-amount.credit {
  color: #16a34a;
}

.tx-amount.debit {
  color: #ef4444;
}

/* Modal styling */
.refill-modal {
  --height: 520px;
  --border-radius: 30px;
  --align-items: flex-end;
}

.modal-wrapper {
  padding: 10px 5px;
}

.modal-wrapper h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 15px 0;
}

.amount-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.amount-bubble {
  background: #f1f5f9;
  border: 2px solid transparent;
  padding: 14px;
  border-radius: 16px;
  text-align: center;
  font-weight: 800;
  color: #334155;
  transition: all 0.2s;
  cursor: pointer;
}

.amount-bubble.active {
  border-color: #5c2d54;
  background: rgba(92, 45, 84, 0.05);
  color: #5c2d54;
}

.custom-amount-box {
  margin-bottom: 25px;
}

.custom-amount-box label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
}

.custom-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  padding: 12px 16px;
  border-radius: 14px;
  outline: none;
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
}

.custom-input:focus {
  border-color: #5c2d54;
}

.payment-card-visual {
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  color: white;
  padding: 20px;
  border-radius: 18px;
  height: 120px;
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-chip {
  width: 32px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 4px;
  opacity: 0.8;
}

.card-number {
  font-size: 1rem;
  letter-spacing: 2px;
  font-weight: 600;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  opacity: 0.8;
  font-weight: 500;
}

.submit-refill-btn {
  --border-radius: 16px;
  height: 52px;
  font-weight: 700;
  --background: #5c2d54;
}

.empty-state-card {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 10px;
  display: block;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: #64748b;
}
</style>
