<template>
  <ion-app>
    <ion-router-outlet />
    <PWAInstall />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import PWAInstall from '@/components/PWAInstall.vue';
</script>
