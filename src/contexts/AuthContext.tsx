import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';

const MOCK_GUEST_USER: User = {
  uid: 'guest-user',
  email: 'guest@dermaestetic.com',
  displayName: 'Invitado Prestige',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  emailVerified: true,
  isAnonymous: true,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
} as any;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      
      if (currentUser) {
        // Enhance anonymous user with a nice placeholder name/photo
        const enhancedUser = {
          ...currentUser,
          displayName: currentUser.displayName || 'Invitado Prestige',
          photoURL: currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        } as User;
        setUser(enhancedUser);
        setLoading(false);
      } else {
        // Attempt clean silent anonymous login
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.warn("Silent anonymous authentication is not enabled or failed. Falling back to Mock Guest session.", error);
          if (active) {
            setUser(MOCK_GUEST_USER);
            setLoading(false);
          }
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    // Set to mock guest instead of logging out completely to prevent showing login wall
    setUser(MOCK_GUEST_USER);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

