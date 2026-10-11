import React, { createContext, useContext } from 'react';
import { useProfileDraft, UseProfileDraftResult } from '../hooks/useProfileDraft';
import { useAuth } from './AuthContext';

const ProfileDraftContext = createContext<UseProfileDraftResult | undefined>(undefined);

export const ProfileDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const draftApi = useProfileDraft(profile);
  return <ProfileDraftContext.Provider value={draftApi}>{children}</ProfileDraftContext.Provider>;
};

export const useProfileDraftContext = (): UseProfileDraftResult => {
  const ctx = useContext(ProfileDraftContext);
  if (!ctx) {
    throw new Error('useProfileDraftContext must be used within a ProfileDraftProvider');
  }
  return ctx;
};
