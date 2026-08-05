import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Key, 
  Save, 
  Camera, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Lock,
  LogOut
} from 'lucide-react';

interface ProfilePageProps {
  onOpenLogin: () => void;
}

export const Profile: React.FC<ProfilePageProps> = ({ onOpenLogin }) => {
  const { user, userProfile, updateUserProfile, logout } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Validation Error', 'Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(displayName.trim(), photoURL.trim() || undefined);
      toast.success('Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged Out Successfully', 'You have been signed out of CogniCode.');
    } catch (err) {
      toast.error('Logout Error', 'An error occurred while logging out.');
    }
  };

  return (
    <ProtectedRoute onOpenLogin={onOpenLogin} fallbackTitle="Profile Access Restricted">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        
        {/* Profile Card Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            {/* Avatar Circle */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 via-blue-600 to-purple-600 p-1 shadow-2xl shadow-sky-500/20">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    className="w-full h-full rounded-full object-cover bg-slate-950"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-slate-300">
                    <UserIcon className="w-10 h-10 text-sky-400" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-slate-950 rounded-full border-2 border-slate-900 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Meta Info */}
            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <h2 className="text-xl font-bold text-slate-100">
                  {user?.displayName || 'Developer Account'}
                </h2>
                <span className="px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full text-[10px] font-mono font-bold">
                  {userProfile?.role || 'Member'}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-cyan-400" />
                  UID: <span className="text-slate-400 truncate max-w-[120px]">{user?.uid}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  Provider: <span className="text-slate-400 capitalize">{user?.providerData[0]?.providerId || 'Email/Password'}</span>
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="shrink-0">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Form & Settings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Update Profile Credentials
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your public display name and avatar photo URL.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter full name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Avatar Photo URL
                </label>
                <div className="relative">
                  <Camera className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Email (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Badges Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Security Overview
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Email Verification</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified via Firebase Auth</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Session Persistence</span>
                  <p className="text-slate-300 font-mono text-[11px]">browserLocalPersistence</p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Security Encryption</span>
                  <p className="text-slate-300 font-mono text-[11px]">RSA-256 JWT Signed</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
};
export default Profile;
