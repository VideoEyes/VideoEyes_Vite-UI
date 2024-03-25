import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Edit from '../views/Edit.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: Home
  },
  {
    path: '/edit',
    component: Edit
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
