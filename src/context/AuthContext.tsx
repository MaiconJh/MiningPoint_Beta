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
  collection,
  getDocs,
  serverTimestamp,
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
    try {
      let loadedProfile = await getUserProfile(currentUser.uid);

      if (!loadedProfile) {
        // Create initial profile if first login
        const usersSnap = await getDocs(collection(db, 'users'));
        const existingShortIds = new Set<string>();
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.shortId && typeof data.shortId === 'string') {
            existingShortIds.add(data.shortId);
          }
        });

        const shortId = ensureUniqueShortId(existingShortIds);

        const userDocRef = doc(db, 'users', currentUser.uid);
        const initialProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || null,
          shortId,
          handle: null,
          hasRedefinedHandle: false,
          primaryGroupId: 'visitante',
          secondaryGroupIds: [],
          isStaff: false,
          effectivePermissions: { ...DEFAULT_EFFECTIVE_PERMISSIONS },
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

      setProfile(loadedProfile);
    } catch (error) {
      console.error('Failed to load user profile from Firestore:', error);
      setProfile(null);
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
