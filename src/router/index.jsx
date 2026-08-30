import { Navigate, Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage } from '../auth/ForgotPasswordPage';
import { GuestRoute, ProtectedRoute } from '../auth/ProtectedRoute';
import { LoginPage } from '../auth/LoginPage';
import { OtpPage } from '../auth/OtpPage';
import { ResetPasswordPage } from '../auth/ResetPasswordPage';
import { SignupPage } from '../auth/SignupPage';
import { VerifyResetOtpPage } from '../auth/VerifyResetOtpPage';
import { StorageDashboardPage } from '../dashboard/StorageDashboardPage';
import { FileExplorerPage } from '../explorer/FileExplorerPage';
import { AppLayout } from '../layout/AppLayout';
import { ServerListPage } from '../servers/ServerListPage';
import { SettingsPage } from '../settings/SettingsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/servers" element={<ServerListPage />} />
          <Route path="/explorer" element={<FileExplorerPage />} />
          <Route path="/dashboard" element={<StorageDashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/servers" replace />} />
      <Route path="*" element={<Navigate to="/servers" replace />} />
    </Routes>
  );
}
