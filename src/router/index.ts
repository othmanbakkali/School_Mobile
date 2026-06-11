
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
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/Tab3Page.vue')
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
        path: 'tab4',
        component: () => import('@/views/Tab4Page.vue')
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
    next(hasStudent ? '/tabs/tab1' : '/selection');
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
