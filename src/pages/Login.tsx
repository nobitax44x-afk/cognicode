import React from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onSuccessNavigateDashboard: () => void;
}

export const Login: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onSuccessNavigateDashboard,
}) => {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to access your saved architecture documentation, AI prompts, and personal settings."
    >
      <LoginForm
        onSwitchToRegister={onNavigateRegister}
        onSuccess={onSuccessNavigateDashboard}
      />
    </AuthLayout>
  );
};
export default Login;
