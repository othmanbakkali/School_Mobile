
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
    path: '/admin/chat/:id',
    component: () => import('@/views/AdminChatPage.vue')
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

router.beforeEach((to, from, next) => {
  const isLogged = odoo.isLogged;
  const hasStudent = !!odoo.selectedStudentId;

  if (to.path === '/login' && isLogged) {
    next(hasStudent ? '/tabs/dashboard' : '/selection');
  } else if (to.path.startsWith('/tabs') && !isLogged) {
    next('/login');
  } else if (to.path.startsWith('/tabs') && isLogged && !hasStudent) {
    next('/selection');
  } else if (to.path === '/selection' && !isLogged) {
    next('/login');
  } else {
    next();
  }
});

export default router
