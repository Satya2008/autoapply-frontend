import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development every /api call goes through Vite to the gateway, so the browser sees one
// origin and the backend needs no CORS setup. Swagger UI is proxied the same way.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gateway = env.VITE_GATEWAY_URL || 'http://localhost:8080';
  const toGateway = { target: gateway, changeOrigin: true };
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': toGateway,
        '/swagger-ui': toGateway,
        '/v3': toGateway,
        '/docs': toGateway,
      },
    },
    test: {
      environment: 'node',
    },
  };
});
