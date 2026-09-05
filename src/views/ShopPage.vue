<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Boutique de l'école</ion-title>
      </ion-toolbar>
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
              <span class="modal-price">{{ selectedProduct.price.toFixed(2) }} MAD</span>
              
              <div class="stock-badge-row">
                <span class="stock-badge" :class="{ out: selectedProduct.stock <= 0 }">
                  {{ selectedProduct.stock > 0 ? 'En Stock (' + selectedProduct.stock + ')' : 'Rupture de Stock' }}
                </span>
              </div>

              <p class="product-desc">{{ selectedProduct.description || 'Aucune description disponible pour cet article.' }}</p>
            </div>

            <!-- Purchase Button -->
            <div class="modal-purchase-footer">
              <div class="wallet-check-note" v-if="walletBalance < selectedProduct.price">
                ⚠️ Solde insuffisant ({{ walletBalance.toFixed(2) }} MAD)
              </div>
              <ion-button 
                expand="block" 
                color="primary" 
                class="buy-btn" 
                :disabled="buying || selectedProduct.stock <= 0 || walletBalance < selectedProduct.price"
                @click="handlePurchase"
              >
                <span v-if="!buying">Confirmer l'achat</span>
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
  IonModal, toastController
} from '@ionic/vue';
import { 
  walletOutline, cartOutline 
} from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const router = useRouter();
const loading = ref(true);
const buying = ref(false);
const products = ref<any[]>([]);
const walletBalance = ref(150.00);

const activeCategory = ref('all');
const productModalOpen = ref(false);
const selectedProduct = ref<any>(null);

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

const goToWallet = () => {
  router.push('/tabs/wallet');
};

const openProductModal = (product: any) => {
  selectedProduct.value = product;
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
    // Refresh student wallet balance
    const config = odoo.userConfig;
    if (config) {
      const students = await apiRequest('/api/school/student', { email: config.email });
      if (students && students.length > 0) {
        const student = students.find((s: any) => s.id === studentId) || students[0];
        walletBalance.value = student.wallet_balance || 0.00;
      }
    }
    
    // Fetch products
    const prodList = await apiRequest('/api/school/shop/products', {});
    products.value = prodList;
  } catch (error) {
    console.error('Failed to load shop items', error);
  } finally {
    loading.value = false;
  }
};

const handlePurchase = async () => {
  const studentId = odoo.selectedStudentId;
  if (!studentId || !selectedProduct.value) return;
  
  buying.value = true;
  try {
    const res = await apiRequest('/api/school/shop/buy', { 
      student_id: studentId, 
      product_id: selectedProduct.value.id 
    });
    
    if (res && res.success) {
      walletBalance.value = res.balance;
      
      const toast = await toastController.create({
        message: `Achat de "${selectedProduct.value.name}" réussi ! Solde débité.`,
        duration: 3500,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
      
      closeProductModal();
      fetchShopData();
    }
  } catch (error: any) {
    console.error('Purchase failed', error);
    const toast = await toastController.create({
      message: error.message || "Échec lors de l'achat du produit.",
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    buying.value = false;
  }
};

const handleStudentChanged = () => {
  fetchShopData();
};

onMounted(() => {
  fetchShopData();
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
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
  margin-bottom: 0;
  border: 1px solid rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.shop-balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #10b981 0%, #047857 100%); /* High contrast green gradient */
  color: white;
  padding: 16px 20px;
  border-radius: 20px;
  margin-top: 5px;
  margin-bottom: 25px;
  box-shadow: 0 10px 25px -8px rgba(16, 185, 129, 0.25);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.shop-balance-bar:active {
  transform: scale(0.97);
}

.balance-text span {
  display: block;
  font-size: 0.75rem;
  opacity: 0.85;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-text strong {
  font-size: 1.15rem;
  font-weight: 850;
  margin-top: 4px;
  display: block;
}

.balance-action ion-icon {
  font-size: 1.55rem;
}

.category-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 14px;
  margin-bottom: 25px;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  padding: 11px 20px;
  border-radius: 50px;
  border: 1.8px solid #e2e8f0;
  font-size: 0.82rem;
  font-weight: 800;
  color: #475569;
  white-space: nowrap;
  background: white;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.cat-chip.active {
  background: #5c2d54;
  color: white;
  border-color: #5c2d54;
  box-shadow: 0 8px 18px rgba(92, 45, 84, 0.2);
  transform: translateY(-2px);
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.product-card:active {
  transform: scale(0.96) translateY(2px);
}

.product-img-box {
  position: relative;
  width: 100%;
  height: 130px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f1f5f9;
}

.product-img-box img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .product-img-box img {
  transform: scale(1.08);
}

.product-category-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(92, 45, 84, 0.85);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-info-box h3 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-val {
  font-size: 0.95rem;
  font-weight: 850;
  color: #5c2d54;
}

/* Dynamic Tricolor Stock Badge styling */
.stock-badge-pill {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 8px;
  text-transform: uppercase;
}

.stock-badge-pill.in-stock {
  background: #dcfce7;
  color: #15803d; /* Compliant green contrast */
}

.stock-badge-pill.low-stock {
  background: #ffedd5;
  color: #c2410c; /* Compliant orange/brown contrast */
}

.stock-badge-pill.out-stock {
  background: #fee2e2;
  color: #b91c1c; /* Compliant red contrast */
}

/* Modal styling with glass effects */
.product-modal {
  --height: 520px;
  --border-radius: 32px;
  --align-items: flex-end;
}

.modal-product-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-img-box {
  height: 160px;
  background: #f8fafc;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid #f1f5f9;
}

.modal-img-box img {
  max-height: 90%;
  object-fit: contain;
}

.modal-meta h2 {
  font-size: 1.35rem;
  font-weight: 850;
  color: #0f172a;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.modal-price {
  font-size: 1.4rem;
  font-weight: 900;
  color: #5c2d54;
  display: block;
  margin-bottom: 14px;
}

.stock-badge-row {
  margin-bottom: 18px;
}

.stock-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stock-badge:not(.out) {
  background: #dcfce7;
  color: #15803d;
}

.stock-badge.out {
  background: #fee2e2;
  color: #b91c1c;
}

.product-desc {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.65;
  margin: 0;
  font-weight: 500;
}

.modal-purchase-footer {
  margin-top: auto;
  padding-top: 20px;
}

.wallet-check-note {
  text-align: center;
  font-size: 0.78rem;
  font-weight: 800;
  color: #b91c1c;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.buy-btn {
  --border-radius: 18px;
  height: 52px;
  font-weight: 800;
  --background: #5c2d54;
  margin: 0;
  box-shadow: 0 8px 20px rgba(92, 45, 84, 0.25);
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
