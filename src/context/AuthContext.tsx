import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, githubProvider, googleProvider } from '../firebase/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: { providerId: string }[];
}

export interface UserProfile {
  role: string;
}

interface AuthApi {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getFriendlyErrorMessage: (err: unknown) => string;
}

export const AuthContext = createContext<AuthApi | null>(null);

export const useAuthContext = () => useContext(AuthContext);

function toAuthUser(u: FirebaseUser): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    providerData: u.providerData.map((p) => ({ providerId: p.providerId })),
  };
}

export function getFriendlyErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const code = (err as { code?: string }).code;
    const message = (err as { message?: string }).message;
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Incorrect email or password. Please try again.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account found for that email address.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Choose a stronger one.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in popup was closed before completing.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Sign-in popup was blocked by the browser. Allow popups and try again.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This preview domain is not authorized for sign-in. Use email/password or authorize the domain in Firebase.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in method is not enabled in the Firebase console.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error. Check your connection and try again.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return 'An account already exists with the same email but a different sign-in method.';
    }
    if (code === 'auth/requires-recent-login') {
      return 'Please sign in again before changing your profile.';
    }
    if (message) return message;
  }
  return 'Something went wrong. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toAuthUser(firebaseUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      setLoading(true);
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence,
        );
        await signInWithEmailAndPassword(auth, email, password);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGithub = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
    } finally {
      setLoading(false);
    }
  }, []);

  const signupWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        const { user: created } = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(created, { displayName: name.trim() });
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateUserProfile = useCallback(async (displayName: string, photoURL?: string) => {
    setLoading(true);
    try {
      const current = auth.currentUser;
      if (!current) throw new Error('No authenticated user');
      await updateProfile(current, { displayName, photoURL: photoURL ?? undefined });
      setUser(toAuthUser(current));
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const api: AuthApi = {
    user,
    userProfile: user ? { role: 'Member' } : null,
    loading,
    loginWithEmail,
    loginWithGoogle,
    loginWithGithub,
    signupWithEmail,
    updateUserProfile,
    resetPassword,
    logout,
    getFriendlyErrorMessage,
  };

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
};
