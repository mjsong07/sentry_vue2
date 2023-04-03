import Vue from 'vue'
import App from './App.vue'
import router from './router'
import MySentry from '@/sentry'

Vue.use(MySentry, { router })
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
