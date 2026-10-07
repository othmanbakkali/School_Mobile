<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Boutique & Livraisons</ion-title>
      </ion-toolbar>
      <div class="segment-container">
        <ion-segment v-model="activeTab" mode="md" class="custom-segment">
          <ion-segment-button value="catalog">
            <ion-label>🛍️ Articles Boutique</ion-label>
          </ion-segment-button>
          <ion-segment-button value="orders">
            <ion-label>📦 Mes Achats & Livraisons ({{ orders.length }})</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        <!-- Student Header Badge -->
        <StudentHeaderBadge />

        <!-- Balance Indicator -->
        <div class="shop-balance-bar" @click="goToWallet">
          <div class="balance-text">
            <span>Solde de votre portefeuille :</span>
            <strong>{{ walletBalance.toFixed(2) }} MAD</strong>
          </div>
          <div class="balance-action">
            <ion-icon :icon="walletOutline"></ion-icon>
          </div>
        </div>

        <!-- ==================== TAB 1: CATALOGUE DES PRODUITS ==================== -->
        <div v-if="activeTab === 'catalog'">
          <!-- Categories -->
          <div class="category-scroll">
            <div 
              v-for="cat in categories" 
              :key="cat.id"
              :class="['cat-chip', { active: activeCategory === cat.id }]"
              @click="activeCategory = cat.id"
            >
              {{ cat.icon }} {{ cat.label }}
            </div>
          </div>

          <!-- Products Grid -->
          <div v-if="loading" class="loading-center">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Chargement du catalogue...</p>
          </div>

          <div v-else-if="filteredProducts.length === 0" class="empty-state-card">
            <ion-icon :icon="cartOutline" class="empty-icon"></ion-icon>
            <p>Aucun produit disponible dans cette catégorie.</p>
          </div>

          <div v-else class="products-grid">
            <div 
              v-for="p in filteredProducts" 
              :key="p.id" 
              class="product-card premium-card" 
              @click="openProductModal(p)"
            >
              <div class="product-img-box">
                <img :src="p.photo ? `data:image/png;base64,${p.photo}` : 'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name" alt="Product Image" />
                <div class="product-category-badge">{{ getCategoryLabel(p.category) }}</div>
              </div>
              <div class="product-info-box ion-padding">
                <h3>{{ p.name }}</h3>
                <div class="product-price-row">
                  <span class="price-val">{{ p.price.toFixed(2) }} MAD</span>
                  <span class="stock-badge-pill" :class="{ 'in-stock': p.stock > 5, 'low-stock': p.stock > 0 && p.stock <= 5, 'out-stock': p.stock <= 0 }">
                    {{ p.stock > 0 ? p.stock + ' dispo' : 'Épuisé' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: MES ACHATS & SUIVI DES LIVRAISONS ==================== -->
        <div v-else-if="activeTab === 'orders'" class="orders-view">
          <div class="orders-hero premium-card ion-padding text-center">
            <span class="orders-hero-icon">📦🚚</span>
            <h3>Suivi des Achats &amp; Livraisons</h3>
            <p>Consultez l'état de préparation et de remise de vos articles, et téléchargez vos bons de livraison et reçus de débit.</p>
          </div>

          <div v-if="loadingOrders" class="loading-center">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Chargement de vos commandes...</p>
          </div>

          <div v-else-if="orders.length === 0" class="empty-state-card">
            <span class="empty-emoji">🛍️</span>
            <h3>Aucun achat boutique effectué</h3>
            <p>Vos commandes d'uniformes, manuels ou fournitures apparaîtront ici après votre achat.</p>
            <button class="back-catalog-btn" @click="activeTab = 'catalog'">Découvrir les articles</button>
          </div>

          <div v-else class="orders-list">
            <div v-for="ord in orders" :key="ord.id" class="order-card premium-card ion-padding">
              <div class="order-header-flex">
                <div>
                  <span class="order-ref">{{ ord.name }}</span>
                  <span class="order-bl-ref" v-if="ord.delivery_slip_number">{{ ord.delivery_slip_number }}</span>
                </div>
                <span class="order-status-badge" :class="ord.state">
                  {{ getOrderStatusLabel(ord.state) }}
                </span>
              </div>

              <div class="order-body-flex">
                <div class="order-item-detail">
                  <h4>{{ ord.product_id ? ord.product_id[1] : 'Article' }}</h4>
                  <p class="order-meta">
                    Quantité : <strong>{{ ord.quantity }}</strong> x {{ (ord.unit_price || 0).toFixed(2) }} MAD
                  </p>
                  <p class="order-date">📅 Acheté le {{ formatDate(ord.date) }}</p>
                </div>
                <div class="order-price-box">
                  <span class="order-total-val">-{{ (ord.amount_total || 0).toFixed(2) }} MAD</span>
                  <span class="order-wallet-note">Déduit du Wallet</span>
                </div>
              </div>

              <!-- Delivery Status Banner -->
              <div class="delivery-info-box" :class="ord.state">
                <div v-if="ord.state === 'delivered'">
                  ✅ <strong>Article Livré</strong> le {{ formatDate(ord.delivery_date) }}
                  <span v-if="ord.delivered_by"> par {{ ord.delivered_by }}</span>
                </div>
                <div v-else-if="ord.state === 'preparing'">
                  ⏳ <strong>En cours de préparation</strong> à l'économat de l'école.
                </div>
                <div v-else-if="ord.state === 'cancelled'">
                  ❌ <strong>Commande annulée</strong> - Montant recrédité sur le portefeuille.
                </div>
                <div v-else>
                  📦 <strong>Payé / En attente de remise</strong> à l'élève ou au parent.
                </div>
              </div>

              <!-- PDF Actions Row -->
              <div class="order-actions-row">
                <button class="pdf-btn delivery-btn" @click="downloadDeliverySlip(ord)" title="Télécharger le Bon de Livraison">
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                  <span>Bon de Livraison (PDF)</span>
                </button>
                <button class="pdf-btn receipt-btn" @click="downloadWalletReceipt(ord)" title="Télécharger le Justificatif de Débit">
                  <ion-icon :icon="receiptOutline"></ion-icon>
                  <span>Reçu Débit (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Product Details Modal -->
      <ion-modal :is-open="productModalOpen" @didDismiss="closeProductModal" class="product-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar mode="md">
            <ion-title>Détails de l'article</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeProductModal" color="medium">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding modal-bg" v-if="selectedProduct">
          <div class="modal-product-content">
            <div class="modal-img-box">
              <img :src="selectedProduct.photo ? `data:image/png;base64,${selectedProduct.photo}` : 'https://api.dicebear.com/7.x/identicon/svg?seed=' + selectedProduct.name" alt="Product Image" />
            </div>
            
            <div class="modal-meta">
              <h2>{{ selectedProduct.name }}</h2>
              <span class="modal-price">{{ (selectedProduct.price * selectedQuantity).toFixed(2) }} MAD</span>
              
              <div class="stock-badge-row">
                <span class="stock-badge" :class="{ out: selectedProduct.stock <= 0 }">
                  {{ selectedProduct.stock > 0 ? 'En Stock (' + selectedProduct.stock + ')' : 'Rupture de Stock' }}
                </span>
              </div>

              <p class="product-desc">{{ selectedProduct.description || 'Aucune description disponible pour cet article.' }}</p>

              <!-- Quantity Selector -->
              <div class="qty-selector-row" v-if="selectedProduct.stock > 0">
                <span class="qty-label">Quantité :</span>
                <div class="qty-controls">
                  <button class="qty-btn" :disabled="selectedQuantity <= 1" @click="selectedQuantity--">-</button>
                  <span class="qty-number">{{ selectedQuantity }}</span>
                  <button class="qty-btn" :disabled="selectedQuantity >= selectedProduct.stock" @click="selectedQuantity++">+</button>
                </div>
              </div>
            </div>

            <!-- Purchase Button -->
            <div class="modal-purchase-footer">
              <div class="wallet-check-note" v-if="walletBalance < (selectedProduct.price * selectedQuantity)">
                ⚠️ Solde insuffisant ({{ walletBalance.toFixed(2) }} MAD vs {{ (selectedProduct.price * selectedQuantity).toFixed(2) }} MAD)
              </div>
              <ion-button 
                expand="block" 
                color="primary" 
                class="buy-btn" 
                :disabled="buying || selectedProduct.stock <= 0 || walletBalance < (selectedProduct.price * selectedQuantity)"
                @click="handlePurchase"
              >
                <span v-if="!buying">Payer avec le Portefeuille ({{ (selectedProduct.price * selectedQuantity).toFixed(2) }} MAD)</span>
                <ion-spinner name="crescent" color="light" v-else></ion-spinner>
              </ion-button>
            </div>
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
  IonModal, IonSegment, IonSegmentButton, IonLabel, toastController
} from '@ionic/vue';
import { 
  walletOutline, cartOutline, documentTextOutline, receiptOutline 
} from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest, getApiBaseUrl } from '@/services/api';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const router = useRouter();
const activeTab = ref<'catalog' | 'orders'>('catalog');
const loading = ref(true);
const loadingOrders = ref(false);
const buying = ref(false);
const products = ref<any[]>([]);
const orders = ref<any[]>([]);
const walletBalance = ref(150.00);

const activeCategory = ref('all');
const productModalOpen = ref(false);
const selectedProduct = ref<any>(null);
const selectedQuantity = ref(1);

const categories = [
  { id: 'all', label: 'Tous', icon: '🛍️' },
  { id: 'uniform', label: 'Uniformes', icon: '👕' },
  { id: 'book', label: 'Livres', icon: '📚' },
  { id: 'material', label: 'Fournitures', icon: '✏️' }
];

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'uniform': return 'Uniforme';
    case 'book': return 'Manuel';
    case 'material': return 'Fourniture';
    default: return 'Article';
  }
};

const getOrderStatusLabel = (state: string) => {
  switch (state) {
    case 'delivered': return '✅ Livré';
    case 'preparing': return '⏳ En Préparation';
    case 'cancelled': return '❌ Annulé';
    case 'paid':
    default: return '📦 Payé / À Livrer';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const goToWallet = () => {
  router.push('/tabs/wallet');
};

const openProductModal = (product: any) => {
  selectedProduct.value = product;
  selectedQuantity.value = 1;
  productModalOpen.value = true;
};

const closeProductModal = () => {
  productModalOpen.value = false;
};

const filteredProducts = computed(() => {
  if (activeCategory.value === 'all') return products.value;
  return products.value.filter(p => p.category === activeCategory.value);
});

const fetchShopData = async () => {
  loading.value = true;
  const studentId = odoo.selectedStudentId;
  if (!studentId) {
    loading.value = false;
    return;
  }
  try {
    const config = odoo.userConfig;
    if (config) {
      const students = await apiRequest('/api/school/student', { email: config.email });
      if (students && students.length > 0) {
        const student = students.find((s: any) => s.id === studentId) || students[0];
        walletBalance.value = student.wallet_balance || 0.00;
      }
    }
    
    const prodList = await apiRequest('/api/school/shop/products', {});
    products.value = prodList;
  } catch (error) {
    console.error('Failed to load shop items', error);
  } finally {
    loading.value = false;
  }
};

const fetchOrders = async () => {
  const studentId = odoo.selectedStudentId;
  if (!studentId) return;
  loadingOrders.value = true;
  try {
    const res = await apiRequest('/api/school/shop/orders', { student_id: studentId });
    if (res && res.success) {
      orders.value = res.orders || [];
    }
  } catch (e) {
    console.warn('Failed to load shop orders', e);
  } finally {
    loadingOrders.value = false;
  }
};

const handlePurchase = async () => {
  const studentId = odoo.selectedStudentId;
  if (!studentId || !selectedProduct.value) return;
  
  buying.value = true;
  try {
    const res = await apiRequest('/api/school/shop/buy', { 
      student_id: studentId, 
      product_id: selectedProduct.value.id,
      quantity: selectedQuantity.value
    });
    
    if (res && res.success) {
      walletBalance.value = res.balance;
      
      const toast = await toastController.create({
        message: `✅ Achat de "${selectedProduct.value.name}" réussi ! Votre commande #${res.order_id || ''} a été enregistrée.`,
        duration: 4000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
      
      closeProductModal();
      await fetchShopData();
      await fetchOrders();
      activeTab.value = 'orders'; // Switch to orders view to see delivery status
    }
  } catch (error: any) {
    console.error('Purchase failed', error);
    const toast = await toastController.create({
      message: error.message || "Échec lors de l'achat du produit.",
      duration: 3500,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    buying.value = false;
  }
};

const downloadDeliverySlip = (ord: any) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/school/shop/delivery-slip/${ord.id}`;
  window.open(url, '_blank');
};

const downloadWalletReceipt = (ord: any) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/school/shop/wallet-receipt/${ord.id}`;
  window.open(url, '_blank');
};

const handleStudentChanged = () => {
  fetchShopData();
  fetchOrders();
};

onMounted(() => {
  fetchShopData();
  fetchOrders();
  window.addEventListener('student-changed', handleStudentChanged);
});

onUnmounted(() => {
  window.removeEventListener('student-changed', handleStudentChanged);
});

watch(() => odoo.selectedStudentId, () => {
  fetchShopData();
  fetchOrders();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.segment-container {
  padding: 10px;
  background: white;
}

.custom-segment {
  --background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}

ion-segment-button {
  --indicator-color: #5c2d54;
  --color: #64748b;
  --color-checked: #ffffff;
  --border-radius: 10px;
  font-weight: 750;
  font-size: 0.82rem;
  min-height: 40px;
}

.modal-bg {
  --background: #ffffff;
}

.premium-card {
  background: white;
  border-radius: 22px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
  margin-bottom: 0;
  border: 1px solid rgba(0,0,0,0.03);
}

.shop-balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #10b981 0%, #047857 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 20px;
  margin-top: 5px;
  margin-bottom: 18px;
  box-shadow: 0 10px 25px -8px rgba(16, 185, 129, 0.25);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.balance-text span {
  display: block;
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 600;
}
.balance-text strong {
  font-size: 1.35rem;
  font-weight: 900;
}
.balance-action {
  background: rgba(255, 255, 255, 0.2);
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

/* Category Scroll */
.category-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 14px;
  scrollbar-width: none;
}
.category-scroll::-webkit-scrollbar { display: none; }

.cat-chip {
  white-space: nowrap;
  padding: 8px 16px;
  border-radius: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-weight: 750;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.cat-chip.active {
  background: #5c2d54;
  color: white;
  border-color: #5c2d54;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 30px;
}
.product-card {
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.product-img-box {
  width: 100%;
  height: 130px;
  position: relative;
  background: #f1f5f9;
}
.product-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-category-badge {
  position: absolute;
  top: 8px; left: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}
.product-info-box h3 {
  margin: 0 0 6px;
  font-size: 0.92rem;
  font-weight: 850;
  color: #1e293b;
  line-height: 1.35;
}
.product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price-val {
  font-size: 0.95rem;
  font-weight: 900;
  color: #5c2d54;
}
.stock-badge-pill {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}
.stock-badge-pill.in-stock { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stock-badge-pill.low-stock { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.stock-badge-pill.out-stock { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

/* Orders View */
.orders-hero {
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(92, 45, 84, 0.12);
  margin-bottom: 16px;
  border-radius: 20px;
}
.orders-hero-icon { font-size: 2.2rem; display: block; margin-bottom: 4px; }
.orders-hero h3 { margin: 0 0 4px; font-size: 1.15rem; font-weight: 850; color: #1e293b; }
.orders-hero p { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.4; }

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 30px;
}
.order-card {
  background: white;
  border-radius: 20px;
}
.order-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}
.order-ref {
  font-size: 0.88rem;
  font-weight: 900;
  color: #5c2d54;
  margin-right: 8px;
}
.order-bl-ref {
  font-size: 0.72rem;
  font-weight: 750;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
}
.order-status-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
}
.order-status-badge.delivered { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.order-status-badge.preparing { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.order-status-badge.cancelled { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.order-status-badge.paid { background: rgba(99, 102, 241, 0.12); color: #6366f1; }

.order-body-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}
.order-item-detail h4 {
  margin: 0 0 2px;
  font-size: 1rem;
  font-weight: 850;
  color: #1e293b;
}
.order-meta {
  margin: 0 0 2px;
  font-size: 0.8rem;
  color: #475569;
}
.order-date {
  margin: 0;
  font-size: 0.72rem;
  color: #94a3b8;
}
.order-price-box {
  text-align: right;
}
.order-total-val {
  display: block;
  font-size: 1.1rem;
  font-weight: 950;
  color: #ef4444;
}
.order-wallet-note {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 600;
}

.delivery-info-box {
  background: #f8fafc;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.78rem;
  color: #334155;
  margin-bottom: 12px;
}
.delivery-info-box.delivered { background: #f0fdf4; border-left: 4px solid #10b981; color: #166534; }
.delivery-info-box.preparing { background: #fefce8; border-left: 4px solid #f59e0b; color: #854d0e; }

.order-actions-row {
  display: flex;
  gap: 10px;
}
.pdf-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  border: 1.5px solid;
  transition: all 0.2s ease;
}
.pdf-btn.delivery-btn {
  background: #fdf4ff;
  border-color: #f0abfc;
  color: #86198f;
}
.pdf-btn.receipt-btn {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

/* Modal */
.modal-product-content {
  display: flex;
  flex-direction: column;
}
.modal-img-box {
  width: 100%;
  height: 200px;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #f1f5f9;
}
.modal-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.modal-meta h2 {
  margin: 0 0 6px;
  font-size: 1.3rem;
  font-weight: 900;
  color: #1e293b;
}
.modal-price {
  font-size: 1.4rem;
  font-weight: 950;
  color: #5c2d54;
  display: block;
  margin-bottom: 8px;
}
.stock-badge-row { margin-bottom: 12px; }
.stock-badge {
  background: #dcfce7;
  color: #166534;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
}
.stock-badge.out { background: #fee2e2; color: #991b1b; }
.product-desc {
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.qty-selector-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 10px 16px;
  border-radius: 14px;
  margin-bottom: 20px;
}
.qty-label {
  font-size: 0.88rem;
  font-weight: 750;
  color: #334155;
}
.qty-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.qty-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: white;
  border: 1.5px solid #cbd5e1;
  font-size: 1.2rem;
  font-weight: 900;
  color: #5c2d54;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.qty-number {
  font-size: 1.1rem;
  font-weight: 900;
  color: #1e293b;
  min-width: 24px;
  text-align: center;
}

.modal-purchase-footer {
  margin-top: auto;
  padding-top: 10px;
}
.wallet-check-note {
  color: #ef4444;
  font-weight: 750;
  font-size: 0.82rem;
  margin-bottom: 8px;
  text-align: center;
}
.buy-btn {
  --border-radius: 14px;
  font-weight: 800;
  height: 48px;
}

.empty-state-card {
  background: white;
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  color: #64748b;
}
.empty-emoji { font-size: 3rem; display: block; margin-bottom: 8px; }
.back-catalog-btn {
  background: #5c2d54;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 800;
  margin-top: 12px;
  cursor: pointer;
}
</style>
