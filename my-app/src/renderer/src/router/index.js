import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Edit from '../views/Edit.vue'
import OutputPreview from '../views/OutputPreview.vue'

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
  },
  {
    path: '/outputPreview',
    component: OutputPreview
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
