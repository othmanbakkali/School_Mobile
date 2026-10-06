
import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import StudentSelectionPage from '../views/StudentSelectionPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/selection',
    component: StudentSelectionPage
  },
  {
    path: '/chat',
    component: () => import('@/views/ChatPage.vue')
  },
  {
    path: '/admin/inbox',
    component: () => import('@/views/AdminInboxPage.vue')
  },
  {
    path: '/admin/appointments',
    component: () => import('@/views/AdminAppointmentsPage.vue')
  },
  {
    path: '/admin/chat/:id',
    component: () => import('@/views/AdminChatPage.vue')
  },
  {
    path: '/faq',
    component: () => import('@/views/FaqPage.vue')
  },
  {
    path: '/FAQ',
    redirect: '/faq'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/dashboard'
      },
      {
        path: 'dashboard',
        component: () => import('@/views/DashboardPage.vue')
      },
      {
        path: 'appointments',
        component: () => import('@/views/AppointmentsPage.vue')
      },
      {
        path: 'rendez-vous',
        redirect: '/tabs/appointments'
      },
      {
        path: 'homework',
        component: () => import('@/views/HomeworkPage.vue')
      },
      {
        path: 'schedule',
        component: () => import('@/views/SchedulePage.vue')
      },
      {
        path: 'notes',
        component: () => import('@/views/NotesPage.vue')
      },
      {
        path: 'absences',
        component: () => import('@/views/AbsencesPage.vue')
      },
      {
        path: 'vie-scolaire',
        component: () => import('@/views/VieScolairePage.vue')
      },
      {
        path: 'payments',
        component: () => import('@/views/PaymentsPage.vue')
      },
      {
        path: 'lost-items',
        component: () => import('@/views/LostItemsPage.vue')
      },
      {
        path: 'album',
        component: () => import('@/views/AlbumPage.vue')
      },
      {
        path: 'transmission',
        component: () => import('@/views/CahierTransmissionPage.vue')
      },
      {
        path: 'reglement',
        component: () => import('@/views/ReglementPage.vue')
      },
      {
        path: 'reglement-interieur',
        redirect: '/tabs/reglement'
      },
      {
        path: 'vacances',
        component: () => import('@/views/VacancesPage.vue')
      },
      {
        path: 'calendrier-vacances',
        redirect: '/tabs/vacances'
      },
      {
        path: 'ressources',
        component: () => import('@/views/RessourcesPage.vue')
      },
      {
        path: 'suivi-pedagogique',
        component: () => import('@/views/SuiviPedagogiquePage.vue')
      },
      {
        path: 'transport',
        component: () => import('@/views/TransportPage.vue')
      },
      {
        path: 'wallet',
        component: () => import('@/views/WalletPage.vue')
      },
      {
        path: 'shop',
        component: () => import('@/views/ShopPage.vue')
      },
      {
        path: 'games',
        component: () => import('@/views/SeriousGamesPage.vue')
      },
      {
        path: 'success',
        component: () => import('@/views/SuccessHubPage.vue')
      },
      {
        path: 'contact',
        component: () => import('@/views/ContactPage.vue')
      },
      {
        path: 'account',
        component: () => import('@/views/AccountPage.vue')
      }
    ]
  }
]

import { odoo } from '@/services/odoo';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  // Supprimer le focus actif avant la transition pour éviter l'avertissement aria-hidden
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const isLogged = odoo.isLogged;
  const isAdmin = localStorage.getItem('is_admin') === 'true';
  const hasStudent = !!odoo.selectedStudentId;

  const saveRedirectAndLogin = () => {
    if (to.fullPath && to.fullPath !== '/' && to.fullPath !== '/login') {
      try {
        localStorage.setItem('redirect_after_login', to.fullPath);
      } catch (e) {}
    }
    return next('/login');
  };

  if (to.path === '/login' && isLogged) {
    const pendingRedirect = localStorage.getItem('redirect_after_login');
    if (pendingRedirect && pendingRedirect.startsWith('/') && pendingRedirect !== '/login' && pendingRedirect !== '/selection') {
      if (isAdmin && (pendingRedirect.startsWith('/admin') || pendingRedirect.startsWith('/chat'))) {
        localStorage.removeItem('redirect_after_login');
        return next(pendingRedirect);
      } else if (!isAdmin && hasStudent && !pendingRedirect.startsWith('/admin')) {
        localStorage.removeItem('redirect_after_login');
        return next(pendingRedirect);
      }
    }
    if (isAdmin) return next('/admin/inbox');
    return next(hasStudent ? '/tabs/dashboard' : '/selection');
  } else if (to.path.startsWith('/admin') && !isLogged) {
    return saveRedirectAndLogin();
  } else if (to.path.startsWith('/tabs') && !isLogged) {
    return saveRedirectAndLogin();
  } else if (to.path.startsWith('/tabs') && isLogged && isAdmin) {
    if (to.path === '/tabs/ressources') {
      return next();
    }
    return next('/admin/inbox');
  } else if (to.path.startsWith('/tabs') && isLogged && !hasStudent) {
    if (to.path === '/tabs/ressources' && isAdmin) {
      return next();
    }
    return next('/selection');
  } else if (to.path === '/selection' && !isLogged) {
    return saveRedirectAndLogin();
  } else if (to.path === '/selection' && isLogged && isAdmin) {
    return next('/admin/inbox');
  } else if (to.path === '/chat' && !isLogged) {
    return saveRedirectAndLogin();
  } else if (to.path === '/chat' && isLogged && isAdmin) {
    return next('/admin/inbox');
  } else if (to.path === '/chat' && isLogged && !hasStudent) {
    return next('/selection');
  }

  // Vérification de l'activation dynamique des onglets Odoo
  if (to.path.startsWith('/tabs/')) {
    try {
      const activeTabs = await odoo.getMenuConfig();
      if (Array.isArray(activeTabs) && activeTabs.length > 0) {
        const allowedPaths = activeTabs.map((t: any) => t.path);
        if (!allowedPaths.includes(to.path) && to.path !== '/tabs/dashboard') {
          console.warn(`[RouteGuard] L'accès à ${to.path} est désactivé depuis Odoo. Redirection vers /tabs/dashboard.`);
          return next('/tabs/dashboard');
        }
      }
    } catch (e) {
      console.error('[RouteGuard] Erreur vérification onglets Odoo:', e);
    }
  }

  next();
});

export default router
