import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { PageTransition } from './components/PageTransition';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/admin/RequireAdmin';
import { AdminLayout } from './layouts/AdminLayout';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Events } from './pages/Events';
import { Members } from './pages/Members';
import { Forum } from './pages/Forum';
import { Shop } from './pages/Shop';
import { OwnProfile } from './pages/OwnProfile';
import { AccountPanel } from './pages/AccountPanel';
import { Login } from './pages/Login';
import { PublicProfile } from './pages/PublicProfile';
import { NotFound } from './pages/NotFound';

// Admin pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetail } from './pages/admin/AdminUserDetail';
import { AdminGroups } from './pages/admin/AdminGroups';
import { AdminBadges } from './pages/admin/AdminBadges';
import { AdminBadgeDetail } from './pages/admin/AdminBadgeDetail';
import { AdminIcons } from './pages/admin/AdminIcons';
import { AdminTitles } from './pages/admin/AdminTitles';
import { AdminTitleDetail } from './pages/admin/AdminTitleDetail';
import { AdminRarities } from './pages/admin/AdminRarities';
import { AdminCatalogCategories } from './pages/admin/AdminCatalogCategories';
import { AdminOrigins } from './pages/admin/AdminOrigins';
import { AdminCollections } from './pages/admin/AdminCollections';
import { AdminForum } from './pages/admin/AdminForum';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminConfig } from './pages/admin/AdminConfig';
import { AdminNotFound } from './pages/admin/AdminNotFound';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isAdmin) {
    return (
      <RequireAdmin>
        <Routes>
          <Route path="/admin" element={<Navigate to="/admin/visao-geral" replace />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/visao-geral" element={<AdminOverview />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
            <Route path="/admin/usuarios/:uid" element={<AdminUserDetail />} />
            <Route path="/admin/grupos" element={<AdminGroups />} />
            <Route path="/admin/insignias" element={<AdminBadges />} />
            <Route path="/admin/insignias/:badgeId" element={<AdminBadgeDetail />} />
            <Route path="/admin/icones" element={<AdminIcons />} />
            <Route path="/admin/titulos" element={<AdminTitles />} />
            <Route path="/admin/titulos/:titleId" element={<AdminTitleDetail />} />
            <Route path="/admin/raridades" element={<AdminRarities />} />
            <Route path="/admin/categorias" element={<AdminCatalogCategories />} />
            <Route path="/admin/origens" element={<AdminOrigins />} />
            <Route path="/admin/colecoes" element={<AdminCollections />} />
            <Route path="/admin/forum" element={<AdminForum />} />
            <Route path="/admin/conteudo" element={<AdminContent />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/configuracao" element={<AdminConfig />} />
            <Route path="/admin/*" element={<AdminNotFound />} />
          </Route>
        </Routes>
      </RequireAdmin>
    );
  }

  // Derive route key: /conta and all sub-routes share the same key to avoid remounting
  const routeKey = location.pathname.startsWith('/conta') ? '/conta' : location.pathname;

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={routeKey}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/sobre" element={<PageTransition><About /></PageTransition>} />
          <Route path="/eventos" element={<PageTransition><Events /></PageTransition>} />
          <Route path="/membros" element={<PageTransition><Members /></PageTransition>} />
          <Route path="/forum" element={<PageTransition><Forum /></PageTransition>} />
          <Route path="/loja" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/entrar" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route
            path="/perfil"
            element={
              <PageTransition>
                <RequireAuth>
                  <OwnProfile />
                </RequireAuth>
              </PageTransition>
            }
          />
          <Route
            path="/perfil/:slug"
            element={
              <PageTransition>
                <PublicProfile />
              </PageTransition>
            }
          />
          <Route
            path="/conta/*"
            element={
              <PageTransition>
                <RequireAuth>
                  <AccountPanel />
                </RequireAuth>
              </PageTransition>
            }
          />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
