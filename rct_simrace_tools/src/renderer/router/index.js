import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
		{
		  path: '/laps-page/:deviceId',
		  name: 'laps-page',
		  component: require('@/components/LapsPage').default
		},
    {
      path: '*',
      redirect: '/'
    }
  ]
})
