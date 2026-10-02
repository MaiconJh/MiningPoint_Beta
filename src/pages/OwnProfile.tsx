import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ProfileView } from '../components/profile/ProfileView';

export const OwnProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <ProfileView userId={user.uid} ownMode={true} />;
};
