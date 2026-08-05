import { useContext } from 'react';
import { AuthContext, getFriendlyErrorMessage } from '../context/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      userProfile: null,
      loading: false,
      loginWithEmail: async () => {},
      loginWithGoogle: async () => {},
      loginWithGithub: async () => {},
      signupWithEmail: async () => {},
      updateUserProfile: async () => {},
      resetPassword: async () => {},
      logout: async () => {},
      getFriendlyErrorMessage,
    };
  }
  return ctx;
}
