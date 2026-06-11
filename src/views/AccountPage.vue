<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-buttons slot="start">
          <ion-menu-button color="dark"></ion-menu-button>
        </ion-buttons>
        <ion-title>Mon Compte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in" v-if="loading">
        <div class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement du compte...</p>
        </div>
      </div>

      <div class="fade-in" v-else>
        <!-- Parent Profile Header -->
        <div class="account-header premium-card ion-padding">
          <div class="avatar-large">
            {{ parentInitials }}
          </div>
          <h2>{{ parentData?.name || 'Parent d\'élève' }}</h2>
          <p>Compte Parent Associé</p>
        </div>

        <!-- Details Form -->
        <div class="section-label">📋 Informations Personnelles</div>
        <div class="premium-card form-card ion-padding">
          <div class="form-group">
            <label>Nom Complet</label>
            <input type="text" v-model="editName" class="form-input" placeholder="Votre nom" />
          </div>
          
          <div class="form-group">
            <label>Adresse Email</label>
            <input type="email" v-model="editEmail" class="form-input" placeholder="Votre email" />
          </div>

          <div class="form-group">
            <label>Numéro de Téléphone</label>
            <input type="tel" v-model="editPhone" class="form-input" placeholder="Votre téléphone" />
          </div>

          <ion-button expand="block" color="primary" class="save-btn" :disabled="saving" @click="handleSave">
            <span v-if="!saving">Sauvegarder les modifications</span>
            <ion-spinner name="crescent" color="light" v-else></ion-spinner>
          </ion-button>
        </div>

        <!-- Children List -->
        <div class="section-label">👶 Enfants Inscrits</div>
        <div class="children-list">
          <div v-for="child in children" :key="child.id" class="child-card premium-card ion-padding">
            <div class="child-avatar">
              <img :src="child.photo ? `data:image/png;base64,${child.photo}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + child.name" alt="Child Avatar" />
            </div>
            <div class="child-info">
              <h3>{{ child.name }}</h3>
              <p>Classe : {{ child.level_id?.[1] || 'Non définie' }}</p>
            </div>
            <div class="child-grade-badge" v-if="child.average_grade">
              {{ child.average_grade.toFixed(2) }}/20
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
  IonButtons, IonMenuButton, IonIcon, IonSpinner, IonButton,
  toastController 
} from '@ionic/vue';
import { ref, computed, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';

const loading = ref(true);
const saving = ref(false);
const parentData = ref<any>(null);
const children = ref<any[]>([]);

const editName = ref('');
const editEmail = ref('');
const editPhone = ref('');

const parentInitials = computed(() => {
  if (!parentData.value?.name) return 'P';
  return parentData.value.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
});

const fetchAccountInfo = async () => {
  loading.value = true;
  const config = odoo.userConfig;
  if (!config) {
    loading.value = false;
    return;
  }
  try {
    const students = await apiRequest('/api/school/student', { email: config.email });
    children.value = students;
    
    if (students && students.length > 0) {
      const parentInfo = students[0].parent_id;
      if (parentInfo) {
        // Fetch parent details
        parentData.value = {
          id: parentInfo[0],
          name: parentInfo[1],
          email: config.email,
          phone: odoo.userConfig?.phone || ''
        };
        editName.value = parentData.value.name;
        editEmail.value = parentData.value.email;
        editPhone.value = parentData.value.phone;
      }
    }
  } catch (error) {
    console.error('Failed to load parent account info', error);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!parentData.value?.id) return;
  saving.value = true;
  try {
    const res = await apiRequest('/api/school/parent/update', {
      parent_id: parentData.value.id,
      name: editName.value,
      email: editEmail.value,
      phone: editPhone.value
    });
    
    if (res && res.success) {
      // Update local storage configuration
      const config = odoo.userConfig;
      if (config) {
        config.email = editEmail.value;
        config.phone = editPhone.value;
        odoo.setUserConfig(config);
      }
      
      parentData.value.name = editName.value;
      parentData.value.email = editEmail.value;
      parentData.value.phone = editPhone.value;
      
      const toast = await toastController.create({
        message: "Informations enregistrées avec succès !",
        duration: 3000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    }
  } catch (error) {
    console.error('Save profile error', error);
    const toast = await toastController.create({
      message: "Erreur lors de l'enregistrement des informations.",
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchAccountInfo();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.premium-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
  border: 1px solid rgba(0,0,0,0.02);
  animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.account-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: 10px;
  animation-delay: 0.05s;
}

.avatar-large {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5c2d54 0%, #3a1934 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  font-size: 1.7rem;
  box-shadow: 0 10px 25px rgba(92, 45, 84, 0.2);
  margin-bottom: 14px;
  border: 3px solid white;
}

.account-header h2 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.4px;
}

.account-header p {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 700;
  margin: 6px 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #5c2d54;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 30px 4px 12px 4px;
}

.form-card {
  animation-delay: 0.15s;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #5c2d54;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.form-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  padding: 14px 18px;
  border-radius: 16px;
  outline: none;
  font-size: 0.98rem;
  font-weight: 650;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.form-input:focus {
  border-color: #5c2d54;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(92, 45, 84, 0.08);
}

.save-btn {
  --border-radius: 16px;
  height: 52px;
  font-weight: 800;
  --background: #5c2d54;
  margin-top: 25px;
  margin-bottom: 0;
  box-shadow: 0 8px 20px rgba(92, 45, 84, 0.2);
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 0;
  border-radius: 22px;
  animation-delay: 0.25s;
}

.child-avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  overflow: hidden;
  background: #f1f5f9;
  flex-shrink: 0;
  border: 1.5px solid #e2e8f0;
}

.child-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-info {
  flex: 1;
}

.child-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.child-info p {
  margin: 4px 0 0 0;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.child-grade-badge {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 850;
  box-shadow: inset 0 0 2px rgba(16, 185, 129, 0.2);
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
