import { apiRequest } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationService = {
  /**
   * Vérifie si les notifications et Service Workers sont supportés par le navigateur/téléphone
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  },

  /**
   * Retourne l'état actuel de la permission ('default' | 'granted' | 'denied' | 'unsupported')
   */
  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Demande l'autorisation à l'utilisateur pour afficher les notifications sur le téléphone
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications non supportées sur ce terminal');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Enregistrer la souscription Web Push automatiquement
        await this.subscribeToPush();
        
        // Déclencher une notification de bienvenue sur le téléphone
        await this.showPhoneNotification("🔔 Notifications activées !", {
          body: "Vous recevrez désormais les alertes de l'école (devoirs, notes, annonces) en direct sur votre téléphone.",
          tag: 'welcome-notification'
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erreur lors de la demande de permission de notification:', e);
      return false;
    }
  },

  /**
   * Déclenche une notification système native sur le téléphone via le Service Worker
   */
  async showPhoneNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      url?: string;
      tag?: string;
      vibrate?: number[];
    }
  ): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options?.body || '',
          icon: options?.icon || '/icons/icon-192.webp',
          badge: options?.badge || '/icons/icon-192.webp',
          tag: options?.tag || 'school-alert',
          renotify: true,
          // Vibration sur mobile : 200ms vibre, 100ms pause, 200ms vibre
          vibrate: options?.vibrate || [200, 100, 200, 100, 200],
          data: {
            url: options?.url || '/tabs/dashboard',
            timestamp: Date.now()
          }
        } as any);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Erreur showNotification via Service Worker, fallback Notification standard:', e);
      try {
        new Notification(title, {
          body: options?.body,
          icon: options?.icon || '/icons/icon-192.webp'
        });
        return true;
      } catch (err) {
        console.error('Échec affichage notification:', err);
        return false;
      }
    }
  },

  /**
   * Souscrit l'appareil aux notifications Web Push en arrière-plan
   */
  async subscribeToPush(parentId?: number | string, studentIds?: number[], isAdmin?: boolean): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg || !reg.pushManager) {
        console.warn('PushManager non disponible dans le Service Worker');
        return false;
      }

      // 1. Récupérer la clé publique VAPID du serveur
      const vapidRes = await apiRequest('/api/push/vapid-public-key');
      if (!vapidRes || !vapidRes.publicKey) {
        console.warn('Impossible de récupérer la clé VAPID du serveur');
        return false;
      }

      // 2. Vérifier si une souscription existe déjà
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidRes.publicKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any
        });
      }

      // 3. Envoyer la souscription au serveur backend
      const parentUser = localStorage.getItem('parent_user');
      let parsedParent = null;
      try {
        if (parentUser) parsedParent = JSON.parse(parentUser);
      } catch (e) {}

      let finalStudentIds: number[] = Array.isArray(studentIds) ? [...studentIds] : [];
      if (finalStudentIds.length === 0) {
        const selectedId = localStorage.getItem('selected_student_id');
        if (selectedId) finalStudentIds.push(parseInt(selectedId));
        const allIds = localStorage.getItem('all_student_ids');
        if (allIds) {
          try {
            const parsed = JSON.parse(allIds);
            if (Array.isArray(parsed)) {
              parsed.forEach((id: number) => {
                if (!finalStudentIds.includes(id)) finalStudentIds.push(id);
              });
            }
          } catch(e) {}
        }
      }

      const isUserAdmin = isAdmin !== undefined ? isAdmin : (localStorage.getItem('is_admin') === 'true');

      await apiRequest('/api/push/subscribe', {
        subscription: subscription.toJSON(),
        parent_id: parentId || parsedParent?.id,
        parent_phone: parsedParent?.phone,
        student_ids: finalStudentIds,
        is_admin: isUserAdmin
      });

      console.log('✅ Souscription Web Push enregistrée avec succès auprès du serveur');
      localStorage.setItem('push_notifications_enabled', 'true');
      return true;
    } catch (e) {
      console.error('Erreur lors de la souscription Web Push:', e);
      return false;
    }
  },

  /**
   * Envoie une notification de test depuis le serveur pour valider la réception sur le téléphone
   */
  async sendServerTestNotification(): Promise<any> {
    const parentUser = localStorage.getItem('parent_user');
    let parentId = null;
    try {
      if (parentUser) parentId = JSON.parse(parentUser)?.id;
    } catch (e) {}

    return await apiRequest('/api/push/send-test', { parent_id: parentId });
  }
};
