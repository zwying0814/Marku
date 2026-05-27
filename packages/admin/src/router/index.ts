import type { RouteRecordRaw } from 'vue-router'

import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import CommentsView from '../views/CommentsView.vue'
import CountersView from '../views/CountersView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DashboardLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView },
      { path: 'users', name: 'users', component: UsersView },
      { path: 'comments', name: 'comments', component: CommentsView },
      { path: 'counters', name: 'counters', component: CountersView },
    ],
  },
]