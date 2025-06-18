import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		process.env.NODE_ENV === 'development' && {
			name: 'socket.io',
			async configureServer(server: any) {
				if (server.httpServer) {
					const { initializeSocketIO } = await import('./src/lib/server/socket');
					initializeSocketIO(server.httpServer);
				}
			}
		}
	].filter(Boolean),
	build: {
		rollupOptions: {
			external: ['sqlite3', '@prisma/client', '.prisma/client/index', '.prisma/client/default'],
			output: {
				manualChunks: undefined
			}
		},
		target: 'node18',
		minify: 'terser',
		sourcemap: false
	},
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	optimizeDeps: {
		include: ['socket.io-client'],
		exclude: ['sqlite3', '@prisma/client']
	},
	ssr: {
		noExternal: [],
		external: ['@prisma/client', '.prisma/client']
	}
});
