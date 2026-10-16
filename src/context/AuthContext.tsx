import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types/profile';
import { getUserProfile, DEFAULT_ATTRIBUTES } from '../lib/profile';
import { DEFAULT_EFFECTIVE_PERMISSIONS } from '../lib/permissions';
import { ensureUniqueShortId } from '../lib/shortId';

export type { UserProfile };

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (currentUser: User) => {
    if (!db) return;
    const isOwner = (currentUser.email || '').toLowerCase().trim() === 'maiconhansen3@gmail.com';

    try {
      let loadedProfile = await getUserProfile(currentUser.uid);

      if (!loadedProfile) {
        // Create initial profile if first login
        const existingShortIds = new Set<string>();
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          usersSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.shortId && typeof data.shortId === 'string') {
              existingShortIds.add(data.shortId);
            }
          });
        } catch {
          // If query fails due to security rules, proceed with freshly generated shortId
        }

        const shortId = ensureUniqueShortId(existingShortIds);

        const userDocRef = doc(db, 'users', currentUser.uid);
        const initialProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || null,
          bannerUrl: null,
          shortId,
          handle: null,
          hasRedefinedHandle: false,
          primaryGroupId: isOwner ? 'admin' : 'visitante',
          secondaryGroupIds: [],
          isStaff: isOwner,
          effectivePermissions: isOwner
            ? {
                accessPanel: true,
                manageUsers: true,
                manageGroups: true,
                manageBadges: true,
                manageForum: true,
                manageContent: true,
                manageCatalogs: true,
              }
            : { ...DEFAULT_EFFECTIVE_PERMISSIONS },
          bio: '',
          featuredTitleId: null,
          visibility: 'public' as const,
          featuredBadges: [],
          attributes: { ...DEFAULT_ATTRIBUTES },
          createdAt: serverTimestamp(),
        };

        await setDoc(userDocRef, initialProfile);
        loadedProfile = await getUserProfile(currentUser.uid);
      }

      if ((isOwner || loadedProfile?.primaryGroupId === 'admin' || loadedProfile?.isStaff) && loadedProfile) {
        if (
          !loadedProfile.effectivePermissions?.accessPanel ||
          !loadedProfile.isStaff ||
          (isOwner && loadedProfile.primaryGroupId !== 'admin')
        ) {
          if (isOwner) {
            loadedProfile.primaryGroupId = 'admin';
          }
          loadedProfile.isStaff = true;
          loadedProfile.effectivePermissions = {
            accessPanel: true,
            manageUsers: true,
            manageGroups: true,
            manageBadges: true,
            manageForum: true,
            manageContent: true,
            manageCatalogs: true,
          };
          const userDocRef = doc(db, 'users', currentUser.uid);
          updateDoc(userDocRef, {
            primaryGroupId: loadedProfile.primaryGroupId,
            isStaff: true,
            effectivePermissions: loadedProfile.effectivePermissions,
          }).catch((err) => console.warn('Could not sync admin to Firestore:', err));
        }
      }

      setProfile(loadedProfile);
    } catch (error) {
      console.error('Failed to load user profile from Firestore:', error);
      if (isOwner) {
        setProfile({
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || null,
          bannerUrl: null,
          shortId: '',
          handle: null,
          hasRedefinedHandle: false,
          primaryGroupId: 'admin',
          secondaryGroupIds: [],
          isStaff: true,
          effectivePermissions: {
            accessPanel: true,
            manageUsers: true,
            manageGroups: true,
            manageBadges: true,
            manageForum: true,
            manageContent: true,
            manageCatalogs: true,
          },
          group: null,
          primaryGroup: null,
          secondaryGroups: [],
          bio: '',
          featuredTitleId: null,
          featuredTitle: null,
          visibility: 'public',
          featuredBadges: [],
          featuredBadgesMode: 'manual',
          attributes: { ...DEFAULT_ATTRIBUTES },
          isBanned: false,
          bannedAt: null,
          bannedBy: null,
          createdAt: Timestamp.now(),
        });
      } else {
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser && db) {
        await loadUserProfile(currentUser);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async (): Promise<void> => {
    if (user && db) {
      await loadUserProfile(user);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth não configurado.');
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOutUser = async (): Promise<void> => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOutUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
