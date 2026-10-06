<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button color="light"></ion-menu-button>
        </ion-buttons>
        <ion-title class="page-title">{{ t('contact.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="gray-bg ion-padding-bottom">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <StudentHeaderBadge />

      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding my-5">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="text-muted mt-2">{{ t('contact.loading') }}</p>
      </div>

      <div v-else class="content-container">
        <!-- Hero School Card -->
        <div class="school-hero-card">
          <div class="hero-bg-shapes"></div>
          <div class="hero-content">
            <div class="school-badge-tag">
              <span class="pulse-dot"></span>
              <span>{{ locale === 'ar' ? 'مؤسسة تعليمية معتمدة' : 'Établissement Homologué' }}</span>
            </div>
            <h1 class="school-name">{{ contactData.name || 'Groupe Scolaire Al Ibdae Al Alamia' }}</h1>
            <p class="school-subtitle">{{ t('contact.subtitle') }}</p>
            
            <div class="hero-quick-actions">
              <button 
                v-if="contactData.pedagogical_director_phone || contactData.administration_phone || contactData.phone" 
                class="quick-action-pill call" 
                @click="callNumber(contactData.pedagogical_director_phone || contactData.administration_phone || contactData.phone)"
              >
                <ion-icon :icon="callOutline"></ion-icon>
                <span>{{ t('contact.callBtn') }}</span>
              </button>
              
              <button 
                v-if="contactData.whatsapp_number" 
                class="quick-action-pill whatsapp" 
                @click="openWhatsApp(contactData.whatsapp_number)"
              >
                <ion-icon :icon="logoWhatsapp"></ion-icon>
                <span>WhatsApp</span>
              </button>

              <button 
                v-if="contactData.map_url" 
                class="quick-action-pill maps" 
                @click="openExternal(contactData.map_url)"
              >
                <ion-icon :icon="navigateOutline"></ion-icon>
                <span>Maps</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section: Responsable Pédagogique (Highlight Card) -->
        <div class="section-wrapper">
          <div class="section-title-wrap">
            <ion-icon :icon="schoolOutline" class="title-icon"></ion-icon>
            <h2>{{ t('contact.pedagogicalManager') }}</h2>
          </div>

          <div class="pedagogical-card">
            <div class="ped-card-top">
              <div class="ped-avatar">
                <ion-icon :icon="personCircleOutline"></ion-icon>
              </div>
              <div class="ped-info">
                <h3>{{ contactData.pedagogical_director_name || (locale === 'ar' ? 'المسؤول التربوي' : 'Directeur Pédagogique') }}</h3>
                <span class="ped-role-badge">{{ t('contact.pedagogicalRole') }}</span>
              </div>
            </div>

            <p class="ped-desc">
              {{ locale === 'ar' 
                ? 'لأي استفسار بخصوص المسار الدراسي، التوجيه، التنسيق مع الأساتذة أو متابعة التعلمات، يمكنكم التواصل مباشرة مع المسؤول التربوي.' 
                : 'Pour toute question relative au suivi pédagogique, à la scolarité de votre enfant ou aux rendez-vous avec les enseignants.' 
              }}
            </p>

            <div class="ped-actions">
              <button 
                v-if="contactData.pedagogical_director_phone" 
                class="ped-btn call" 
                @click="callNumber(contactData.pedagogical_director_phone)"
              >
                <ion-icon :icon="callOutline"></ion-icon>
                <span>{{ t('contact.callBtn') }}</span>
              </button>

              <button 
                v-if="contactData.pedagogical_director_phone" 
                class="ped-btn whatsapp" 
                @click="openWhatsApp(contactData.pedagogical_director_phone, 'Bonjour, je vous contacte concernant le suivi scolaire de mon enfant.')"
              >
                <ion-icon :icon="logoWhatsapp"></ion-icon>
                <span>{{ t('contact.whatsappBtn') }}</span>
              </button>

              <button 
                v-if="contactData.pedagogical_director_email" 
                class="ped-btn email" 
                @click="sendEmail(contactData.pedagogical_director_email)"
              >
                <ion-icon :icon="mailOutline"></ion-icon>
                <span>{{ t('contact.emailBtn') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section: WhatsApp Officiel -->
        <div v-if="contactData.whatsapp_number" class="section-wrapper">
          <div class="whatsapp-banner" @click="openWhatsApp(contactData.whatsapp_number)">
            <div class="wa-left">
              <div class="wa-icon-box">
                <ion-icon :icon="logoWhatsapp"></ion-icon>
              </div>
              <div class="wa-texts">
                <h4>{{ t('contact.officialWhatsapp') }}</h4>
                <p>{{ contactData.whatsapp_number }}</p>
                <span class="wa-hint">{{ t('contact.whatsappDesc') }}</span>
              </div>
            </div>
            <div class="wa-arrow">
              <span>{{ t('contact.chatOnWhatsapp') }}</span>
              <ion-icon :icon="arrowForwardOutline"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Section: Localisation & Google Maps -->
        <div class="section-wrapper">
          <div class="section-title-wrap">
            <ion-icon :icon="locationOutline" class="title-icon"></ion-icon>
            <h2>{{ t('contact.addressTitle') }}</h2>
          </div>

          <div class="location-card">
            <div class="loc-header">
              <div class="loc-pin">
                <ion-icon :icon="pinOutline"></ion-icon>
              </div>
              <div class="loc-text">
                <h4>{{ contactData.map_address || contactData.address || 'Boulevard Moulay Rachid, Tanger' }}</h4>
                <p v-if="contactData.address && contactData.map_address !== contactData.address">{{ contactData.address }}</p>
              </div>
            </div>

            <div class="loc-actions">
              <button class="loc-btn maps-btn" @click="openMap">
                <ion-icon :icon="mapOutline"></ion-icon>
                <span>{{ t('contact.openInMaps') }}</span>
              </button>
              <button class="loc-btn dir-btn" @click="openMapDirections">
                <ion-icon :icon="navigateOutline"></ion-icon>
                <span>{{ t('contact.getDirections') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section: Réseaux Sociaux -->
        <div class="section-wrapper">
          <div class="section-title-wrap">
            <ion-icon :icon="shareSocialOutline" class="title-icon"></ion-icon>
            <h2>{{ t('contact.socialNetworks') }}</h2>
          </div>

          <div class="social-grid">
            <!-- Facebook -->
            <div 
              class="social-tile facebook" 
              @click="openExternal(contactData.facebook_url || 'https://www.facebook.com/alibdaealamia')"
            >
              <div class="social-icon">
                <ion-icon :icon="logoFacebook"></ion-icon>
              </div>
              <div class="social-info">
                <h4>Facebook</h4>
                <p>{{ t('contact.followFacebook') }}</p>
              </div>
              <ion-icon :icon="openOutline" class="social-open"></ion-icon>
            </div>

            <!-- Instagram -->
            <div 
              class="social-tile instagram" 
              @click="openExternal(contactData.instagram_url || 'https://www.instagram.com/alibdaealamia')"
            >
              <div class="social-icon">
                <ion-icon :icon="logoInstagram"></ion-icon>
              </div>
              <div class="social-info">
                <h4>Instagram</h4>
                <p>{{ t('contact.followInstagram') }}</p>
              </div>
              <ion-icon :icon="openOutline" class="social-open"></ion-icon>
            </div>

            <!-- Site Web -->
            <div 
              class="social-tile website" 
              @click="openExternal(contactData.website_url || 'https://www.alibdaealamia.ma')"
            >
              <div class="social-icon">
                <ion-icon :icon="globeOutline"></ion-icon>
              </div>
              <div class="social-info">
                <h4>Site Web</h4>
                <p>{{ t('contact.visitWebsite') }}</p>
              </div>
              <ion-icon :icon="openOutline" class="social-open"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Section: Secrétariat & Horaires -->
        <div class="section-wrapper">
          <div class="section-title-wrap">
            <ion-icon :icon="businessOutline" class="title-icon"></ion-icon>
            <h2>{{ t('contact.secretariat') }}</h2>
          </div>

          <div class="info-list-card">
            <div 
              v-if="contactData.administration_phone || contactData.phone" 
              class="info-row clickable"
              @click="callNumber(contactData.administration_phone || contactData.phone)"
            >
              <div class="info-icon phone-icon">
                <ion-icon :icon="callOutline"></ion-icon>
              </div>
              <div class="info-details">
                <span class="info-label">{{ t('contact.standardPhone') }}</span>
                <span class="info-val">{{ contactData.administration_phone || contactData.phone }}</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="row-arrow"></ion-icon>
            </div>

            <div 
              v-if="contactData.emergency_phone" 
              class="info-row clickable"
              @click="callNumber(contactData.emergency_phone)"
            >
              <div class="info-icon emergency-icon">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
              </div>
              <div class="info-details">
                <span class="info-label">{{ t('contact.emergencyPhone') }}</span>
                <span class="info-val">{{ contactData.emergency_phone }}</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="row-arrow"></ion-icon>
            </div>

            <div 
              v-if="contactData.email" 
              class="info-row clickable"
              @click="sendEmail(contactData.email)"
            >
              <div class="info-icon email-icon">
                <ion-icon :icon="mailOutline"></ion-icon>
              </div>
              <div class="info-details">
                <span class="info-label">{{ t('contact.generalEmail') }}</span>
                <span class="info-val">{{ contactData.email }}</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="row-arrow"></ion-icon>
            </div>

            <div class="info-row">
              <div class="info-icon time-icon">
                <ion-icon :icon="timeOutline"></ion-icon>
              </div>
              <div class="info-details">
                <span class="info-label">{{ t('contact.openingHours') }}</span>
                <span class="info-val">{{ contactData.opening_hours || 'Lundi - Vendredi : 08h00 - 18h00' }}</span>
              </div>
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
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
  IonRefresher, IonRefresherContent,
  onIonViewWillEnter
} from '@ionic/vue';
import {
  callOutline,
  schoolOutline,
  personCircleOutline,
  mailOutline,
  logoWhatsapp,
  locationOutline,
  pinOutline,
  mapOutline,
  navigateOutline,
  shareSocialOutline,
  logoFacebook,
  logoInstagram,
  globeOutline,
  openOutline,
  businessOutline,
  timeOutline,
  alertCircleOutline,
  chevronForwardOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { ref } from 'vue';
import { apiRequest } from '@/services/api';
import { useI18n } from '@/services/translationService';
import StudentHeaderBadge from '@/components/StudentHeaderBadge.vue';

const { t, locale } = useI18n();

const loading = ref(true);
const contactData = ref<any>({
  name: 'Groupe Scolaire Al Ibdae Al Alamia',
  pedagogical_director_name: 'Directeur Pédagogique',
  pedagogical_director_phone: '+212 6 61 23 45 67',
  pedagogical_director_email: 'pedagogie@alibdaealamia.ma',
  administration_phone: '+212 5 39 90 12 34',
  phone: '+212 5 39 90 12 34',
  whatsapp_number: '+212 6 61 23 45 67',
  emergency_phone: '+212 6 61 99 88 77',
  opening_hours: 'Lundi - Vendredi : 08h00 - 18h00 | Samedi : 08h30 - 12h30',
  email: 'contact@alibdaealamia.ma',
  address: 'Boulevard Moulay Rachid, Tanger, Maroc',
  map_address: 'Boulevard Moulay Rachid, Tanger',
  map_url: 'https://maps.google.com/?q=Groupe+Scolaire+Al+Ibdae+Al+Alamia+Tanger',
  facebook_url: 'https://www.facebook.com/alibdaealamia',
  instagram_url: 'https://www.instagram.com/alibdaealamia',
  website_url: 'https://www.alibdaealamia.ma'
});

const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
};

const callNumber = (phone: string) => {
  if (!phone) return;
  const clean = cleanPhoneNumber(phone);
  window.open(`tel:${clean}`, '_system');
};

const sendEmail = (email: string) => {
  if (!email) return;
  window.open(`mailto:${email}`, '_system');
};

const openWhatsApp = (phone: string, defaultMsg = 'Bonjour, je vous contacte depuis l\'application Al Ibdae Al Alamia.') => {
  if (!phone) return;
  let clean = phone.replace(/[^\d]/g, '');
  // Si le numéro commence par 0, le convertir en indicatif marocain 212
  if (clean.startsWith('0')) {
    clean = '212' + clean.slice(1);
  }
  const encodedMsg = encodeURIComponent(defaultMsg);
  const url = `https://wa.me/${clean}?text=${encodedMsg}`;
  window.open(url, '_system');
};

const openExternal = (url: string) => {
  if (!url) return;
  let targetUrl = url;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  window.open(targetUrl, '_system');
};

const openMap = () => {
  if (contactData.value.map_url) {
    openExternal(contactData.value.map_url);
  } else {
    const q = encodeURIComponent(contactData.value.map_address || contactData.value.address || 'Al Ibdae Al Alamia Tanger');
    window.open(`https://maps.google.com/?q=${q}`, '_system');
  }
};

const openMapDirections = () => {
  const dest = encodeURIComponent(contactData.value.map_address || contactData.value.address || 'Al Ibdae Al Alamia Tanger');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_system');
};

const fetchContactInfo = async () => {
  loading.value = true;
  try {
    const res = await apiRequest('/api/school/contact-info', {});
    if (res && typeof res === 'object') {
      contactData.value = { ...contactData.value, ...res };
    }
  } catch (err) {
    console.warn('Utilisation des données de contact par défaut:', err);
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: any) => {
  await fetchContactInfo();
  event.target.complete();
};

onIonViewWillEnter(() => {
  fetchContactInfo();
});
</script>

<style scoped>
.gray-bg {
  --background: #f8fafc;
}

.custom-toolbar {
  --background: linear-gradient(135deg, #5c2d54 0%, #3e1e38 100%);
  --color: #ffffff;
}

.page-title {
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.3px;
}

.content-container {
  padding: 14px 16px 36px 16px;
  max-width: 720px;
  margin: 0 auto;
}

/* Hero School Card */
.school-hero-card {
  position: relative;
  background: linear-gradient(135deg, #5c2d54 0%, #7d3c72 50%, #472141 100%);
  border-radius: 24px;
  padding: 24px 20px;
  color: white;
  box-shadow: 0 12px 28px -6px rgba(92, 45, 84, 0.35);
  overflow: hidden;
  margin-bottom: 22px;
}

.hero-bg-shapes {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}

.school-badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 12px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.school-name {
  font-size: 1.35rem;
  font-weight: 850;
  margin: 0 0 6px 0;
  line-height: 1.25;
}

.school-subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  margin: 0 0 18px 0;
  line-height: 1.4;
}

.hero-quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-action-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  border: none;
  padding: 8px 14px;
  border-radius: 14px;
  font-weight: 750;
  font-size: 0.82rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-pill:active {
  transform: scale(0.95);
}

.quick-action-pill.call {
  background: #ffffff;
  color: #5c2d54;
}

.quick-action-pill.whatsapp {
  background: #25d366;
  color: #ffffff;
}

.quick-action-pill.maps {
  background: #0284c7;
  color: #ffffff;
}

/* Sections */
.section-wrapper {
  margin-bottom: 22px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.title-icon {
  font-size: 1.25rem;
  color: #5c2d54;
}

.section-title-wrap h2 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.3px;
}

/* Pedagogical Card */
.pedagogical-card {
  background: white;
  border-radius: 20px;
  padding: 18px;
  border: 1px solid rgba(92, 45, 84, 0.12);
  box-shadow: 0 6px 20px -6px rgba(92, 45, 84, 0.08);
}

.ped-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ped-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(92, 45, 84, 0.12) 0%, rgba(92, 45, 84, 0.04) 100%);
  color: #5c2d54;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  flex-shrink: 0;
}

.ped-info h3 {
  font-size: 1.08rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.ped-role-badge {
  display: inline-block;
  background: rgba(92, 45, 84, 0.08);
  color: #5c2d54;
  font-size: 0.72rem;
  font-weight: 750;
  padding: 2px 8px;
  border-radius: 8px;
}

.ped-desc {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0 0 16px 0;
}

.ped-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ped-btn {
  flex: 1;
  min-width: 90px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 12px;
  border: none;
  font-weight: 750;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ped-btn:active {
  transform: scale(0.96);
}

.ped-btn.call {
  background: rgba(92, 45, 84, 0.1);
  color: #5c2d54;
}

.ped-btn.whatsapp {
  background: #25d366;
  color: white;
}

.ped-btn.email {
  background: #f1f5f9;
  color: #334155;
}

/* WhatsApp Banner */
.whatsapp-banner {
  background: linear-gradient(135deg, #128c7e 0%, #25d366 100%);
  color: white;
  border-radius: 20px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 8px 24px -4px rgba(37, 211, 102, 0.35);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.whatsapp-banner:active {
  transform: scale(0.98);
}

.wa-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wa-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.wa-texts h4 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 2px 0;
}

.wa-texts p {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0 0 3px 0;
  opacity: 0.95;
}

.wa-hint {
  font-size: 0.72rem;
  opacity: 0.85;
}

.wa-arrow {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.25);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 750;
  white-space: nowrap;
}

/* Location Card */
.location-card {
  background: white;
  border-radius: 20px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.loc-header {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.loc-pin {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(2, 132, 199, 0.1);
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.loc-text h4 {
  font-size: 0.96rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.loc-text p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.35;
}

.loc-actions {
  display: flex;
  gap: 10px;
}

.loc-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 12px;
  border: none;
  font-weight: 750;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.loc-btn:active {
  transform: scale(0.96);
}

.maps-btn {
  background: #0284c7;
  color: white;
}

.dir-btn {
  background: #f1f5f9;
  color: #0f172a;
}

/* Social Grid */
.social-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-tile {
  background: white;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-tile:active {
  transform: scale(0.98);
}

.social-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.social-tile.facebook .social-icon {
  background: rgba(24, 119, 242, 0.1);
  color: #1877f2;
}

.social-tile.instagram .social-icon {
  background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
  color: white;
}

.social-tile.website .social-icon {
  background: rgba(92, 45, 84, 0.1);
  color: #5c2d54;
}

.social-info {
  flex: 1;
}

.social-info h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 2px 0;
}

.social-info p {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
}

.social-open {
  color: #94a3b8;
  font-size: 1.1rem;
}

/* Info List Card */
.info-list-card {
  background: white;
  border-radius: 20px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.clickable {
  cursor: pointer;
}

.info-row.clickable:active {
  opacity: 0.7;
}

.info-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.phone-icon { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.emergency-icon { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.email-icon { background: rgba(139, 92, 246, 0.1); color: #7c3aed; }
.time-icon { background: rgba(245, 158, 11, 0.1); color: #d97706; }

.info-details {
  flex: 1;
}

.info-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.info-val {
  display: block;
  font-size: 0.88rem;
  font-weight: 750;
  color: #1e293b;
  margin-top: 1px;
}

.row-arrow {
  color: #cbd5e1;
  font-size: 1.1rem;
}
</style>
