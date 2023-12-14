import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/article',
      name: 'article',
      component: () => import('../views/ArticleView.vue')
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/EditorView.vue')
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue')
    },
    {
      path: '/tool',
      name: 'tool',
      component: () => import('../views/ToolsView.vue')
    },
    {
      path: '/new',
      name: 'new',
      component: () => import('../views/NewHomeView.vue')
    }
  ]
})

// router.beforeEach((to, from, next) => {
//   debugger
//   if (to.hash) {
//     // handle anchor link - do nothing, browser will take care of it
//   } else {
//     // handle other navigation
//     console.log(`Navigating to ${to.fullPath}`)
//     from.meta.nextPage = to.fullPath // set the `nextPage` value of the current route's meta data to the URL being navigated to
//     next()
//   }
// })

export default router
