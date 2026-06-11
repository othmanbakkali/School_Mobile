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
                <span class="stock-val" :class="{ low: p.stock <= 3 }">Stock: {{ p.stock }}</span>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';

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

onMounted(() => {
  fetchShopData();
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
  margin-bottom: 0;
}

.shop-balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 14px 20px;
  border-radius: 18px;
  margin-top: 5px;
  margin-bottom: 25px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  cursor: pointer;
  transition: transform 0.2s;
}

.shop-balance-bar:active {
  transform: scale(0.97);
}

.balance-text span {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 600;
}

.balance-text strong {
  font-size: 1.1rem;
  font-weight: 800;
}

.balance-action ion-icon {
  font-size: 1.4rem;
}

.category-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 25px;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  padding: 10px 18px;
  border-radius: 50px;
  border: 1.5px solid #e2e8f0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-chip.active {
  background: #5c2d54;
  color: white;
  border-color: #5c2d54;
  box-shadow: 0 4px 10px rgba(92, 45, 84, 0.15);
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  cursor: pointer;
}

.product-card:active {
  transform: scale(0.96);
}

.product-img-box {
  position: relative;
  width: 100%;
  height: 120px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-img-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-category-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(15, 23, 42, 0.7);
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 8px;
  text-transform: uppercase;
}

.product-info-box h3 {
  margin: 0 0 6px 0;
  font-size: 0.85rem;
  font-weight: 700;
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
  font-size: 0.9rem;
  font-weight: 800;
  color: #5c2d54;
}

.stock-val {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
}

.stock-val.low {
  color: #ef4444;
}

/* Modal styling */
.product-modal {
  --height: 480px;
  --border-radius: 30px;
  --align-items: flex-end;
}

.modal-product-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-img-box {
  height: 150px;
  background: #f8fafc;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 20px;
}

.modal-img-box img {
  max-height: 100%;
  object-fit: contain;
}

.modal-meta h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 5px 0;
}

.modal-price {
  font-size: 1.3rem;
  font-weight: 800;
  color: #5c2d54;
  display: block;
  margin-bottom: 12px;
}

.stock-badge-row {
  margin-bottom: 15px;
}

.stock-badge {
  background: #dcfce7;
  color: #16a34a;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

.stock-badge.out {
  background: #fee2e2;
  color: #ef4444;
}

.product-desc {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.modal-purchase-footer {
  margin-top: auto;
  padding-top: 20px;
}

.wallet-check-note {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 8px;
}

.buy-btn {
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
