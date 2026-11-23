import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-advise-dev-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/advise' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                req.body = body ? JSON.parse(body) : {};
              } catch {
                req.body = {};
              }

              try {
                const { default: handler } = await import('./api/advise.js');
                const resWrapper = {
                  setHeader: (k, v) => res.setHeader(k, v),
                  status: (code) => {
                    res.statusCode = code;
                    return resWrapper;
                  },
                  json: (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end: () => res.end()
                };
                await handler(req, resWrapper);
              } catch (err) {
                console.error('Dev server API error:', err);
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ fallback: true, error: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
