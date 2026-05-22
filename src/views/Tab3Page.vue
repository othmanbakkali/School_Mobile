
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar mode="md">
        <ion-title>Vie Scolaire</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding gray-bg">
      <div class="fade-in">
        
        <div class="section-container">
          <div class="section-title">
            <h2>🍽️ Menu Cantine</h2>
            <p>La semaine du 20 Avril</p>
          </div>

          <div class="premium-card canteen-box ion-padding">
            <div class="day-scroll">
              <div v-for="day in days" :key="day" 
                   :class="['day-bubble', { active: activeDay === day }]"
                   @click="activeDay = day">
                {{ day }}
              </div>
            </div>

            <div class="menu-content">
              <div class="menu-item">
                <div class="menu-icon">🥗</div>
                <div class="menu-text">
                  <span>Entrée</span>
                  <p>{{ currentMenu.starter }}</p>
                </div>
              </div>
              <div class="menu-item main-dish">
                <div class="menu-icon">🍝</div>
                <div class="menu-text">
                  <span>Plat Principal</span>
                  <p>{{ currentMenu.main }}</p>
                </div>
              </div>
              <div class="menu-item">
                <div class="menu-icon">🍎</div>
                <div class="menu-text">
                  <span>Dessert</span>
                  <p>{{ currentMenu.dessert }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-container" style="margin-top: 35px;">
          <div class="section-title">
            <h2>✉️ École & Contacts</h2>
            <p>Administration et Enseignants</p>
          </div>

          <div class="contacts-grid">
            <div v-for="contact in contacts" :key="contact.id" class="premium-card contact-tile">
              <ion-avatar>
                <img :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + contact.name" />
              </ion-avatar>
              <h3>{{ contact.name }}</h3>
              <p>{{ contact.email || 'Enseignant' }}</p>
              <ion-button fill="clear" size="small" class="msg-btn">
                <ion-icon slot="icon-only" :icon="chatbubbleEllipsesOutline"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>

        <div class="section-container" style="margin-top: 35px;">
          <div class="section-title">
            <h2>💰 Mes Paiements</h2>
            <p>Historique des frais de scolarité</p>
          </div>
          <div v-if="payments.length === 0" class="premium-card ion-padding empty-state-small">
            <p>Aucun paiement enregistré pour l'année en cours.</p>
          </div>
          <div v-else class="payments-list">
            <div v-for="pay in payments" :key="pay.id" class="premium-card payment-item">
              <div class="pay-month">{{ formatMonth(pay.month) }}</div>
              <div class="pay-info">
                <h4>{{ pay.amount }} DHS</h4>
                <p>{{ formatDate(pay.date) }}</p>
              </div>
              <div class="pay-status" :class="pay.state">{{ pay.state === 'paid' ? 'Payé' : 'En attente' }}</div>
            </div>
          </div>
        </div>

        <div class="section-container" style="margin-top: 35px;">
          <div class="section-title">
            <h2>🔍 Objets Perdus</h2>
            <p>Retrouvez vos affaires égarées</p>
          </div>
          <div v-if="lostItems.length === 0" class="premium-card ion-padding empty-state-small">
            <p>Aucun objet perdu signalé récemment.</p>
          </div>
          <div v-else class="lost-items-grid">
            <div v-for="item in lostItems" :key="item.id" class="premium-card lost-item-card">
              <img v-if="item.photo" :src="'data:image/png;base64,' + item.photo" class="lost-img" />
              <div v-else class="lost-placeholder">📦</div>
              <div class="lost-info ion-padding">
                <h3>{{ item.name }}</h3>
                <p>{{ item.location || 'Lieu inconnu' }}</p>
                <small>{{ formatDate(item.date_found) }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="section-container" style="margin-top: 35px;">
          <div class="section-title">
            <h2>💬 Messagerie Directe</h2>
            <p>Discuter avec l'administration en temps réel</p>
          </div>
          <div class="premium-card chat-entry-card ion-padding" @click="router.push('/chat')">
            <div class="chat-icon-bg">
              <ion-icon :icon="chatbubblesOutline"></ion-icon>
            </div>
            <div class="chat-text">
              <h3>Ouvrir la discussion</h3>
              <p>Consulter l'historique et envoyer un message</p>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="arrow-icon"></ion-icon>
          </div>
        </div>

        <div class="emergency-box premium-card">
          <div class="emergency-icon">
            <ion-icon :icon="callOutline"></ion-icon>
          </div>
          <div class="emergency-node">
            <h4>Urgence Scolaire</h4>
            <p>Ligne directe secrétariat</p>
            <h3>05 22 12 34 56</h3>
          </div>
          <ion-button color="danger" class="call-btn">Appeler</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonAvatar, IonButton, IonIcon, onIonViewWillEnter
} from '@ionic/vue';
import { chatbubbleEllipsesOutline, callOutline, chatbubblesOutline, chevronForwardOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { odoo } from '@/services/odoo';
import { apiRequest } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const activeDay = ref('Lun');
const allMenus = ref<any[]>([]);
const contacts = ref<any[]>([]);
const payments = ref<any[]>([]);
const lostItems = ref<any[]>([]);

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

const fetchData = async () => {
    const config = odoo.userConfig;
    if (!config) {
        router.replace('/login');
        return;
    }
    try {
        allMenus.value = await apiRequest('/api/school/canteen', {});
        contacts.value = await apiRequest('/api/school/contacts', {});
        
        const students = await apiRequest('/api/school/student', { email: config.email });
        const selectedId = odoo.selectedStudentId;
        const studentId = students.find((s: any) => s.id === selectedId)?.id || students[0]?.id;
        
        if (studentId) {
            payments.value = await odoo.getPayments(studentId);
        }
        lostItems.value = await odoo.getLostItems();
    } catch (e: any) {
        console.error('Fetch failed', e);
        if (e.message?.includes('401') || e.message?.includes('Not logged in')) {
          odoo.logout();
          router.replace('/login');
        }
    }
};

onIonViewWillEnter(() => {
  fetchData();
});

onMounted(() => {
    fetchData();
});

const currentMenu = computed(() => {
    if (allMenus.value.length === 0) return { starter: 'Chargement...', main: '...', dessert: '...' };
    const dayIdx = days.indexOf(activeDay.value);
    return allMenus.value[dayIdx % allMenus.value.length] || allMenus.value[0];
});
</script>

<style scoped>
.section-title {
  margin-bottom: 20px;
}

.section-title h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e293b;
}

.section-title p {
  margin: 4px 0 0 0;
  color: #94a3b8;
  font-size: 0.95rem;
}

.canteen-box {
  background: white;
}

.day-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.day-scroll::-webkit-scrollbar { display: none; }

.day-bubble {
  padding: 10px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 800;
  color: #1e293b;
  min-width: 70px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-bubble.active {
  background: #6366f1;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 14px;
}

.main-dish {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
}

.menu-icon {
  font-size: 1.6rem;
}

.menu-text span {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.menu-text p {
  margin: 2px 0 0 0;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.contacts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.contact-tile {
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 15px;
  text-align: center;
  position: relative;
}

.contact-tile ion-avatar {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  border: 2px solid #f1f5f9;
}

.contact-tile h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.contact-tile p {
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.msg-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  --color: #6366f1;
}

.emergency-box {
  margin-top: 30px;
  background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  padding: 15px;
  gap: 15px;
}

.emergency-icon {
  width: 45px;
  height: 45px;
  background: #ef4444;
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.emergency-node { flex: 1; }
.emergency-node h4 { margin: 0; font-size: 0.85rem; color: #991b1b; font-weight: 700; }
.emergency-node p { margin: 0; font-size: 0.7rem; color: #ef4444; }
.emergency-node h3 { margin: 2px 0 0 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }

.call-btn {
  --border-radius: 10px;
  font-weight: 700;
}

.chat-entry-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.chat-entry-card:active { transform: scale(0.98); }

.chat-icon-bg {
  width: 50px;
  height: 50px;
  background: #dcf8c6;
  color: #128c7e;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.chat-text { flex: 1; }
.chat-text h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
.chat-text p { margin: 2px 0 0; font-size: 0.85rem; color: #94a3b8; }
.arrow-icon { color: #cbd5e1; font-size: 1.2rem; }

.album-scroll {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 15px;
}

.album-scroll::-webkit-scrollbar {
  display: none;
}

.album-item {
  min-width: 200px;
  max-width: 250px;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.album-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 15px;
  gap: 15px;
  background: white;
}

.pay-month {
  width: 50px;
  height: 50px;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.pay-info { flex: 1; }
.pay-info h4 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
.pay-info p { margin: 2px 0 0; font-size: 0.8rem; color: #94a3b8; }

.pay-status {
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}
.pay-status.paid { background: #dcfce7; color: #16a34a; }
.pay-status.unpaid { background: #fee2e2; color: #ef4444; }

.lost-items-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.lost-item-card {
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lost-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.lost-placeholder {
  width: 100%;
  height: 100px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.lost-info h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1e293b; }
.lost-info p { margin: 2px 0 0; font-size: 0.75rem; color: #64748b; }
.lost-info small { display: block; margin-top: 5px; color: #94a3b8; font-size: 0.65rem; }

.empty-state-small {
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
