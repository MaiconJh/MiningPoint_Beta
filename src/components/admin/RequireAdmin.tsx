import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotFound } from '../../pages/NotFound';

interface RequireAdminProps {
  children: React.ReactElement;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  const userEmail = (user?.email || profile?.email || '').toLowerCase().trim();
  const isOwnerAdmin = userEmail === 'maiconhansen3@gmail.com';
  const hasAccessPanel =
    !profile?.isBanned &&
    (isOwnerAdmin ||
      profile?.primaryGroupId === 'admin' ||
      profile?.isStaff === true ||
      !!profile?.effectivePermissions?.accessPanel);
  if (!hasAccessPanel) {
    return <NotFound />;
  }

  return children;
};
