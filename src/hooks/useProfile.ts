import { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserBadge, FeaturedBadgeItem } from '../types/profile';
import {
  getUserProfile,
  listUserBadges,
  getFeaturedBadgeItems,
} from '../lib/profile';
import { useAuth } from '../context/AuthContext';

export interface UseProfileResult {
  profile: UserProfile | null;
  userBadges: UserBadge[];
  featuredBadges: FeaturedBadgeItem[];
  loading: boolean;
  notFound: boolean;
  refetch: () => Promise<void>;
}

export const useProfile = (userId: string | undefined): UseProfileResult => {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [featuredBadges, setFeaturedBadges] = useState<FeaturedBadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const userDoc = await getUserProfile(userId);

      if (!userDoc) {
        setNotFound(true);
        setProfile(null);
        setUserBadges([]);
        setFeaturedBadges([]);
        setLoading(false);
        return;
      }

      // Check visibility
      const isOwner = currentUser?.uid === userId;
      const canViewPrivate =
        isOwner ||
        currentProfile?.effectivePermissions?.manageUsers === true ||
        currentProfile?.isStaff === true;
      if (userDoc.visibility === 'private' && !canViewPrivate) {
        setNotFound(true);
        setProfile(null);
        setUserBadges([]);
        setFeaturedBadges([]);
        setLoading(false);
        return;
      }

      setProfile(userDoc);

      // Load user badges & featured badges in parallel
      const [uBadges, featBadges] = await Promise.all([
        listUserBadges(userId),
        getFeaturedBadgeItems(userId, userDoc.featuredBadges),
      ]);

      setUserBadges(uBadges);
      setFeaturedBadges(featBadges);
      setNotFound(false);
    } catch (err) {
      console.error('Failed to load profile in useProfile hook:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    currentUser?.uid,
    currentProfile?.isStaff,
    currentProfile?.effectivePermissions?.manageUsers,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize when current authenticated user's profile updates
  useEffect(() => {
    if (userId && currentUser?.uid === userId && currentProfile) {
      setProfile(currentProfile);
      getFeaturedBadgeItems(userId, currentProfile.featuredBadges || []).then((featBadges) => {
        setFeaturedBadges(featBadges);
      });
    }
  }, [userId, currentUser?.uid, currentProfile]);

  return {
    profile,
    userBadges,
    featuredBadges,
    loading,
    notFound,
    refetch: loadData,
  };
};
