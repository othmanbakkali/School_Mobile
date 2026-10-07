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
            <p class="balance-status">Actif • Rechargé à l'administration de l'école • Utilisable pour les achats boutique &amp; cantine</p>
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
              <div class="tx-header-row">
                <h3>{{ t.description }}</h3>
                <span v-if="t.receipt_number" class="tx-receipt-badge">{{ t.receipt_number }}</span>
              </div>
              <p>{{ formatDate(t.date) }}</p>
            </div>
            <div class="tx-right-box">
              <div class="tx-amount" :class="t.type">
                {{ t.type === 'credit' ? '+' : '-' }}{{ t.amount.toFixed(2) }} MAD
              </div>
              <button class="tx-receipt-btn" @click.stop="downloadReceipt(t)" title="Télécharger le reçu officiel">
                <ion-icon :icon="receiptOutline"></ion-icon>
                <span>Reçu PDF</span>
              </button>
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
  IonButtons, IonMenuButton, IonIcon, IonSpinner 
} from '@ionic/vue';
import { 
  cardOutline, swapHorizontalOutline, arrowDownOutline, arrowUpOutline, receiptOutline 
} from 'ionicons/icons';
import { ref, onMounted, onUnmounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest, getApiBaseUrl } from '@/services/api';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const loading = ref(true);
const balance = ref(0.00);
const transactions = ref<any[]>([]);

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

const downloadReceipt = (t: any) => {
  if (!t || !t.id) return;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/school/wallet/receipt/${t.id}`;
  window.open(url, '_blank');
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
  opacity: 0.8;
  margin: 0 0 10px 0;
  font-weight: 600;
  position: relative;
  z-index: 2;
  line-height: 1.4;
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

.tx-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tx-receipt-badge {
  font-size: 0.68rem;
  font-weight: 700;
  font-family: monospace;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 1px 6px;
  border-radius: 6px;
  letter-spacing: 0.2px;
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

.tx-right-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
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

.tx-receipt-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
}

.tx-receipt-btn:hover, .tx-receipt-btn:active {
  background: #dbeafe;
  color: #1e40af;
  transform: translateY(-1px);
}

.tx-receipt-btn ion-icon {
  font-size: 0.9rem;
  color: #2563eb;
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
