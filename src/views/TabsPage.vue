
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="dashboard" href="/tabs/dashboard">
          <ion-icon aria-hidden="true" :icon="homeOutline" />
          <ion-label>Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="scolarite" href="/tabs/scolarite">
          <ion-icon aria-hidden="true" :icon="schoolOutline" />
          <ion-label>Scolarité</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="payments" href="/tabs/payments">
          <ion-icon aria-hidden="true" :icon="walletOutline" />
          <ion-label>Paiements</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="lost-items" href="/tabs/lost-items">
          <ion-icon aria-hidden="true" :icon="searchOutline" />
          <ion-label>Objets</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="vie-scolaire" href="/tabs/vie-scolaire">
          <ion-icon aria-hidden="true" :icon="restaurantOutline" />
          <ion-label>Vie</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="album" href="/tabs/album">
          <ion-icon aria-hidden="true" :icon="imagesOutline" />
          <ion-label>Album</ion-label>
        </ion-tab-button>
      </ion-tab-bar>

    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { homeOutline, schoolOutline, restaurantOutline, walletOutline, searchOutline, imagesOutline } from 'ionicons/icons';
</script>

<style scoped>
.custom-tab-bar {
  --border: none;
  --background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  height: 65px;
}

ion-tab-button {
  --color-selected: var(--ion-color-primary);
}
</style>
