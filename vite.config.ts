import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'pdf-explorer-plugin',
        buildStart() {
          const publicPdfDir = path.resolve(__dirname, 'public/pdf');
          const rootPdfDir = path.resolve(__dirname, 'pdf');

          function mirrorDir(src: string, dst: string) {
            if (!fs.existsSync(src)) return;
            if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
            const entries = fs.readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name === 'manifest.json' || entry.name === '.gitkeep') continue;
              const s = path.join(src, entry.name);
              const d = path.join(dst, entry.name);
              if (entry.isDirectory()) {
                mirrorDir(s, d);
              } else if (entry.isFile()) {
                if (!fs.existsSync(d) || fs.statSync(s).mtimeMs > fs.statSync(d).mtimeMs || fs.statSync(s).size !== fs.statSync(d).size) {
                  fs.copyFileSync(s, d);
                }
              }
            }
          }

          function cleanRemoved(src: string, dst: string) {
            if (!fs.existsSync(dst) || !fs.existsSync(src)) return;
            const entries = fs.readdirSync(dst, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name === 'manifest.json' || entry.name === '.gitkeep') continue;
              const s = path.join(src, entry.name);
              const d = path.join(dst, entry.name);
              if (!fs.existsSync(s)) {
                if (entry.isDirectory()) {
                  fs.rmSync(d, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(d);
                }
              } else if (entry.isDirectory()) {
                cleanRemoved(s, d);
              }
            }
          }

          function syncPdfDirectories() {
            if (fs.existsSync(rootPdfDir) && fs.existsSync(publicPdfDir)) {
              cleanRemoved(rootPdfDir, publicPdfDir);
              mirrorDir(rootPdfDir, publicPdfDir);
            } else if (fs.existsSync(rootPdfDir)) {
              fs.cpSync(rootPdfDir, publicPdfDir, { recursive: true });
            } else if (fs.existsSync(publicPdfDir)) {
              fs.cpSync(publicPdfDir, rootPdfDir, { recursive: true });
            }
          }

          function buildTree(dirPath: string, relativePath = ''): any {
            if (!fs.existsSync(dirPath)) return null;
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            const children: any[] = [];
            for (const entry of entries) {
              if (entry.name === 'manifest.json' || entry.name.startsWith('.')) continue;
              const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
              const fullPath = path.join(dirPath, entry.name);
              if (entry.isDirectory()) {
                const subTree = buildTree(fullPath, entryRelPath);
                children.push({
                  name: entry.name,
                  path: entryRelPath,
                  type: 'folder',
                  children: subTree?.children || [],
                });
              } else if (entry.isFile()) {
                if (!entry.name.toLowerCase().endsWith('.pdf')) continue;
                const stats = fs.statSync(fullPath);
                children.push({
                  name: entry.name,
                  path: entryRelPath,
                  type: 'file',
                  size: stats.size,
                  updatedAt: stats.mtime.toISOString(),
                });
              }
            }
            children.sort((a, b) => {
              if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
              return a.name.localeCompare(b.name);
            });
            return { name: 'pdf', path: relativePath, type: 'folder', children };
          }

          syncPdfDirectories();
          const tree = buildTree(publicPdfDir);
          if (tree) {
            const str = JSON.stringify(tree, null, 2);
            fs.writeFileSync(path.resolve(publicPdfDir, 'manifest.json'), str, 'utf-8');
            if (fs.existsSync(rootPdfDir)) {
              fs.writeFileSync(path.resolve(rootPdfDir, 'manifest.json'), str, 'utf-8');
            }
          }
        },
        configureServer(server) {
          const publicPdfDir = path.resolve(__dirname, 'public/pdf');
          const rootPdfDir = path.resolve(__dirname, 'pdf');

          function mirrorDir(src: string, dst: string) {
            if (!fs.existsSync(src)) return;
            if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
            const entries = fs.readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name === 'manifest.json' || entry.name === '.gitkeep') continue;
              const s = path.join(src, entry.name);
              const d = path.join(dst, entry.name);
              if (entry.isDirectory()) {
                mirrorDir(s, d);
              } else if (entry.isFile()) {
                if (!fs.existsSync(d) || fs.statSync(s).mtimeMs > fs.statSync(d).mtimeMs || fs.statSync(s).size !== fs.statSync(d).size) {
                  fs.copyFileSync(s, d);
                }
              }
            }
          }

          function cleanRemoved(src: string, dst: string) {
            if (!fs.existsSync(dst) || !fs.existsSync(src)) return;
            const entries = fs.readdirSync(dst, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name === 'manifest.json' || entry.name === '.gitkeep') continue;
              const s = path.join(src, entry.name);
              const d = path.join(dst, entry.name);
              if (!fs.existsSync(s)) {
                if (entry.isDirectory()) {
                  fs.rmSync(d, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(d);
                }
              } else if (entry.isDirectory()) {
                cleanRemoved(s, d);
              }
            }
          }

          function syncPdfDirectories() {
            if (fs.existsSync(rootPdfDir) && fs.existsSync(publicPdfDir)) {
              cleanRemoved(rootPdfDir, publicPdfDir);
              mirrorDir(rootPdfDir, publicPdfDir);
            } else if (fs.existsSync(rootPdfDir)) {
              fs.cpSync(rootPdfDir, publicPdfDir, { recursive: true });
            } else if (fs.existsSync(publicPdfDir)) {
              fs.cpSync(publicPdfDir, rootPdfDir, { recursive: true });
            }
          }

          function buildTree(dirPath: string, relativePath = ''): any {
            if (!fs.existsSync(dirPath)) return null;
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            const children: any[] = [];
            for (const entry of entries) {
              if (entry.name === 'manifest.json' || entry.name.startsWith('.')) continue;
              const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
              const fullPath = path.join(dirPath, entry.name);
              if (entry.isDirectory()) {
                const subTree = buildTree(fullPath, entryRelPath);
                children.push({
                  name: entry.name,
                  path: entryRelPath,
                  type: 'folder',
                  children: subTree?.children || [],
                });
              } else if (entry.isFile()) {
                if (!entry.name.toLowerCase().endsWith('.pdf')) continue;
                const stats = fs.statSync(fullPath);
                children.push({
                  name: entry.name,
                  path: entryRelPath,
                  type: 'file',
                  size: stats.size,
                  updatedAt: stats.mtime.toISOString(),
                });
              }
            }
            children.sort((a, b) => {
              if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
              return a.name.localeCompare(b.name);
            });
            return { name: 'pdf', path: relativePath, type: 'folder', children };
          }

          function syncManifest(): any {
            syncPdfDirectories();
            const tree = buildTree(publicPdfDir);
            if (tree) {
              const str = JSON.stringify(tree, null, 2);
              fs.writeFileSync(path.resolve(publicPdfDir, 'manifest.json'), str, 'utf-8');
              if (fs.existsSync(rootPdfDir)) {
                fs.writeFileSync(path.resolve(rootPdfDir, 'manifest.json'), str, 'utf-8');
              }
            }
            return tree;
          }

          server.middlewares.use((req, res, next) => {
            const rawUrl = req.url || '';

            // Handle direct PDF streaming
            if (rawUrl.startsWith('/pdf/')) {
              try {
                const decoded = decodeURIComponent(rawUrl.split('?')[0]);
                const relPath = decoded.replace(/^\/pdf\//, '');
                const targetPublic = path.join(publicPdfDir, relPath);
                const targetRoot = path.join(rootPdfDir, relPath);
                const targetFile = fs.existsSync(targetPublic) ? targetPublic : (fs.existsSync(targetRoot) ? targetRoot : null);

                if (targetFile && fs.statSync(targetFile).isFile()) {
                  const stat = fs.statSync(targetFile);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader('Content-Length', stat.size);
                  res.setHeader('Accept-Ranges', 'bytes');
                  fs.createReadStream(targetFile).pipe(res);
                  return;
                }
              } catch (_) {
                // fall through to next
              }
            }

            // Handle API tree query
            if (rawUrl.startsWith('/api/pdf-explorer')) {
              res.setHeader('Content-Type', 'application/json');
              try {
                if (req.method === 'GET' && (rawUrl === '/api/pdf-explorer/tree' || rawUrl.startsWith('/api/pdf-explorer/tree?'))) {
                  const tree = syncManifest();
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, root: tree }));
                  return;
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
                return;
              }
            }

            next();
          });
        },
        closeBundle() {
          const srcDir = path.resolve(__dirname, 'public/pdf');
          const destDir = path.resolve(__dirname, 'dist/pdf');
          if (fs.existsSync(srcDir)) {
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            fs.cpSync(srcDir, destDir, { recursive: true });
          }
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
