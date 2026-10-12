/**
 * NEXO Dual Portal Build Script
 * Generates separate production distributions:
 *  - dist-customer/  (Customer Platform for Cloudflare Pages / public hosting)
 *  - dist-admin/     (Admin Control Center for Cloudflare Pages / admin hosting)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n============================================================');
console.log('🚀 NEXO: Generating Separate Customer & Admin Dist Folders');
console.log('============================================================\n');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('❌ Base dist/ folder not found. Please run "npx vite build" first.');
  process.exit(1);
}

// 1. Build dist-customer/
const distCustomerDir = path.join(__dirname, 'dist-customer');
if (fs.existsSync(distCustomerDir)) {
  fs.rmSync(distCustomerDir, { recursive: true, force: true });
}
fs.cpSync(distDir, distCustomerDir, { recursive: true });

// Inject Customer configuration in dist-customer/index.html
const custHtmlPath = path.join(distCustomerDir, 'index.html');
if (fs.existsSync(custHtmlPath)) {
  let custHtml = fs.readFileSync(custHtmlPath, 'utf-8');
  custHtml = custHtml.replace(
    '<head>',
    `<head>\n    <script>window.__NEXO_PORTAL__ = 'customer';</script>`
  );
  fs.writeFileSync(custHtmlPath, custHtml, 'utf-8');
}
// Copy Cloudflare Functions to dist-customer
const functionsDir = path.join(__dirname, 'functions');
if (fs.existsSync(functionsDir)) {
  fs.cpSync(functionsDir, path.join(distCustomerDir, 'functions'), { recursive: true });
}

// Cloudflare Pages Routing Configuration
const routesJson = JSON.stringify({
  version: 1,
  include: ['/api/*'],
  exclude: ['/assets/*', '/favicon.ico', '/*.*'],
}, null, 2);

// Apply to dist/
fs.writeFileSync(path.join(distDir, '_redirects'), `/api/*   /api/:splat   200\n/*       /index.html   200\n`);
fs.writeFileSync(path.join(distDir, '_routes.json'), routesJson);
if (fs.existsSync(functionsDir)) {
  fs.cpSync(functionsDir, path.join(distDir, 'functions'), { recursive: true });
}

// Redirects & routes for dist-customer
fs.writeFileSync(
  path.join(distCustomerDir, '_redirects'),
  `/api/*   /api/:splat   200\n/*       /index.html   200\n`
);
fs.writeFileSync(path.join(distCustomerDir, '_routes.json'), routesJson);
console.log('✅ 1. Customer Portal generated:  dist-customer/');

// 2. Build dist-admin/
const distAdminDir = path.join(__dirname, 'dist-admin');
if (fs.existsSync(distAdminDir)) {
  fs.rmSync(distAdminDir, { recursive: true, force: true });
}
fs.cpSync(distDir, distAdminDir, { recursive: true });

// Copy Cloudflare Functions to dist-admin
if (fs.existsSync(functionsDir)) {
  fs.cpSync(functionsDir, path.join(distAdminDir, 'functions'), { recursive: true });
}

// Inject Admin configuration in dist-admin/index.html
const adminHtmlPath = path.join(distAdminDir, 'index.html');
if (fs.existsSync(adminHtmlPath)) {
  let adminHtml = fs.readFileSync(adminHtmlPath, 'utf-8');
  adminHtml = adminHtml.replace(
    '<head>',
    `<head>\n    <script>window.__NEXO_PORTAL__ = 'admin';</script>`
  );
  adminHtml = adminHtml.replace(
    '<title>NEXO — Next Experience Commerce Opportunity</title>',
    '<title>NEXO — Admin Control Center</title>'
  );
  fs.writeFileSync(adminHtmlPath, adminHtml, 'utf-8');
}
fs.writeFileSync(
  path.join(distAdminDir, '_redirects'),
  `/api/*   /api/:splat   200\n/*       /index.html   200\n`
);
fs.writeFileSync(path.join(distAdminDir, '_routes.json'), routesJson);

// Copy database schema, wrangler configs, and _worker.js to distributions
const routeJsPath = path.join(__dirname, 'functions', 'api', '[[route]].js');
for (const dir of [distDir, distCustomerDir, distAdminDir]) {
  if (fs.existsSync(routeJsPath)) {
    fs.copyFileSync(routeJsPath, path.join(dir, '_worker.js'));
  }
  if (fs.existsSync(path.join(__dirname, 'schema.sql'))) {
    fs.copyFileSync(path.join(__dirname, 'schema.sql'), path.join(dir, 'schema.sql'));
  }
  if (fs.existsSync(path.join(__dirname, 'wrangler.toml'))) {
    fs.copyFileSync(path.join(__dirname, 'wrangler.toml'), path.join(dir, 'wrangler.toml'));
  }
}

console.log('✅ 2. Admin Portal generated:     dist-admin/\n');

console.log('============================================================');
console.log('🎉 Done! Both portals are ready to publish:');
console.log('   👉 dist-customer/ -> Upload to Cloudflare Pages (Customer Site)');
console.log('   👉 dist-admin/    -> Upload to Cloudflare Pages (Admin Site)');
console.log('============================================================\n');

process.exit(0);
