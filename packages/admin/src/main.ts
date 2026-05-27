import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import { routes } from './router'

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App).use(createPinia()).use(router).mount('#app')
