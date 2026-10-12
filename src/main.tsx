import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

const isAdminPortal =
  (window as any).__NEXO_PORTAL__ === 'admin' ||
  window.location.pathname.startsWith('/admin') ||
  window.location.search.includes('admin=true') ||
  window.location.search.includes('portal=admin') ||
  window.location.hash.includes('admin');

createRoot(document.getElementById('root')!).render(
  isAdminPortal ? <AdminApp /> : <App />
);
