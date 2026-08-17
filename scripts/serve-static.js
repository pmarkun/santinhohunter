const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(require.main === module ? process.argv[2] || 'dist' : 'dist');
const port = Number(process.env.PORT || 8080);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
};

function resolveFile(requestUrl, accept = '') {
  const url = new URL(requestUrl, `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const candidate = path.resolve(root, `.${pathname}`);

  if (!candidate.startsWith(root)) {
    return null;
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  const staticRoute = `${candidate}.html`;
  if (fs.existsSync(staticRoute) && fs.statSync(staticRoute).isFile()) {
    return staticRoute;
  }

  if (path.extname(pathname) || (accept && !accept.includes('text/html'))) {
    return null;
  }

  return path.join(root, 'index.html');
}

function cacheControl(file) {
  const relativePath = path.relative(root, file);
  if (relativePath === 'service-worker.js' || path.extname(file) === '.html') {
    return 'no-cache';
  }
  if (path.extname(file) === '.webmanifest') {
    return 'public, max-age=3600';
  }
  if (relativePath.startsWith(`_expo${path.sep}static${path.sep}`)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=86400';
}

function canonicalLocation(request) {
  const host = (request.headers.host || '').split(':')[0].toLowerCase();
  if (host !== 'www.santinhohunter.com.br') {
    return null;
  }
  return `https://santinhohunter.com.br${request.url || '/'}`;
}

function createStaticServer() {
  return http.createServer((request, response) => {
    const canonical = canonicalLocation(request);
    if (canonical) {
      response.writeHead(308, { Location: canonical });
      response.end();
      return;
    }

    const file = resolveFile(request.url || '/', request.headers.accept || '');

    if (!file || !fs.existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Cache-Control': cacheControl(file),
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      ...(path.basename(file) === 'service-worker.js'
        ? { 'Service-Worker-Allowed': '/' }
        : {}),
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(file).pipe(response);
  });
}

if (require.main === module) {
  createStaticServer().listen(port, '0.0.0.0', () => {
    console.log(`Serving ${root} on ${port}`);
  });
}

module.exports = { cacheControl, canonicalLocation, createStaticServer, resolveFile };
