import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

// 确保DOM已加载完成并且目标元素存在
const initApp = () => {
	try {
		// 检查挂载元素是否存在
		const appElement = document.getElementById('app');
		if (!appElement) {
			console.error('找不到挂载元素 #app');
			return;
		}

		// 检查是否已经有Vue实例挂载在此元素上
		if ((appElement as any).__vue_app__) {
			console.warn('发现已存在的Vue应用实例，跳过重复挂载');
			return;
		}

		// 创建并挂载Vue应用
		const app = createApp(App);
		app.use(router);

		// 添加错误处理
		app.config.errorHandler = (err, vm, info) => {
			console.error('Vue应用错误:', err, info);
		};

		app.mount(appElement);
		console.log('Vue应用已成功挂载');
	} catch (error) {
		console.error('Vue应用初始化失败:', error);
	}
};

// 确保在正确的时机初始化应用
const ensureInit = () => {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initApp);
	} else {
		// 使用微任务确保DOM完全准备就绪
		setTimeout(initApp, 0);
	}
};

// 如果是在嵌入环境中，可能需要等待容器准备就绪
if (typeof window !== 'undefined') {
	// 检查是否在iframe中或其他嵌入环境
	if (window.parent !== window.self) {
		// 在iframe中，额外等待一下
		setTimeout(ensureInit, 100);
	} else {
		ensureInit();
	}
} else {
	ensureInit();
}
