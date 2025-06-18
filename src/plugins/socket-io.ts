import { createServer } from 'http';
import type { ViteDevServer } from 'vite';
import { initializeSocketIO } from '../lib/server/socket';

export function socketIOPlugin() {
  return {
    name: 'socket-io',
    configureServer(server: ViteDevServer) {
      if (!server.httpServer) return;

      // Initialize Socket.IO with the HTTP server
      initializeSocketIO(server.httpServer);
      
      console.log('Socket.IO plugin configured for development');
    }
  };
}
