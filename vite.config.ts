import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	base: '/vue-dist',
	root: 'vue',
	plugins: [vue()],
	build: {
		outDir: '../vue-dist',
	},
});
