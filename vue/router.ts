import { createRouter, createWebHashHistory } from 'vue-router';

import Inductor from './pages/Inductor.vue';
import Via from './pages/Via.vue';
import Wire from './pages/Wire.vue';

const router = createRouter({
	history: createWebHashHistory('vue-dist'),
	routes: [
		{
			path: '/Via',
			name: 'Via',
			component: Via,
		},
		{
			path: '/Wire',
			name: 'Wire',
			component: Wire,
		},
		{
			path: '/Inductor',
			name: 'Inductor',
			component: Inductor,
		},
		{
			path: '/',
			name: 'home',
			redirect: { name: 'Via' },
		},
		{
			path: '/:pathMatch(.*)*',
			name: 'not-found',
			redirect: { name: 'Via' },
		},
	],
});

// 添加导航守卫，处理路由错误
router.onError((error) => {
	console.error('路由错误:', error);
});

export default router;
