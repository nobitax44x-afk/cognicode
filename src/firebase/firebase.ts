import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyB5mJzVdEqaTLbWMXjPwKHQZ4hzeGJsa7k',
  authDomain: 'cognicode-e9d13.firebaseapp.com',
  projectId: 'cognicode-e9d13',
  storageBucket: 'cognicode-e9d13.firebasestorage.app',
  messagingSenderId: '823988338008',
  appId: '1:823988338008:web:121a8656ebe4d43a26392d',
  measurementId: 'G-N0Y263DX0J',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const analytics: Analytics | null =
  typeof window !== 'undefined' ? getAnalytics(app) : null;
