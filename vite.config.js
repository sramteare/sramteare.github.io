import { defineConfig } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: 'src',
  plugins: [
    react(),
    viteTsconfigPaths(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: '../packages/**/*',
          dest: 'packages'
        }
      ]
    }),
    {
      name: 'serve-packages',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url, 'http://localhost');
          let pathname = url.pathname;
          
          if (pathname.startsWith('/packages')) {
            // Serve index.html if request is a directory
            if (pathname.endsWith('/')) {
              pathname += 'index.html';
            }
            
            const targetPath = path.join(__dirname, pathname);
            
            if (fs.existsSync(targetPath)) {
              const stat = fs.statSync(targetPath);
              if (stat.isDirectory()) {
                res.writeHead(301, { Location: pathname + '/' });
                res.end();
                return;
              }
              
              const ext = path.extname(targetPath).toLowerCase();
              const mimeTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.mjs': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.wasm': 'application/wasm'
              };
              
              res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
              fs.createReadStream(targetPath).pipe(res);
              return;
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    headers: { 
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
});