<template>
  <ion-app>
    <!-- Sidebar Menu -->
    <ion-menu side="start" contentId="main">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item button detail="false" @click="navigate('/tabs/transmission')">
            <ion-label>Transmission</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="navigate('/tabs/ressources')">
            <ion-label>Ressources</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="navigate('/tabs/boutique')">
            <ion-label>Boutique</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="navigate('/tabs/wallet')">
            <ion-label>Student Wallet</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="navigate('/tabs/chat')">
            <ion-label>Chat</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="navigate('/tabs/album')">
            <ion-label>Photo Album</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="navigate('/tabs/news')">
            <ion-label>News</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- Main Content -->
    <ion-router-outlet id="main" />
    <PWAInstall />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue';
import { useRouter } from 'vue-router';
import PWAInstall from '@/components/PWAInstall.vue';

const router = useRouter();
function navigate(path: string) {
  router.push(path);
}
</script>

