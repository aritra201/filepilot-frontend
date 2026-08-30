import { api, unwrap } from './client';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(unwrap),
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  verifyRegistrationOtp: (email, otp) =>
    api.post('/auth/verify-registration-otp', { email, otp }).then(unwrap),
  resendRegistrationOtp: (email) =>
    api.post('/auth/resend-registration-otp', { email }).then(unwrap),
  google: (id_token) => api.post('/auth/google', { id_token }).then(unwrap),
  logout: () => api.post('/auth/logout', {}),
  getUser: () => api.get('/auth/get-user').then(unwrap),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(unwrap),
  verifyForgotPasswordOtp: (email, otp) =>
    api.post('/auth/verify-forgot-password-otp', { email, otp }).then(unwrap),
  resendForgotPasswordOtp: (email) =>
    api.post('/auth/resend-forgot-password-otp', { email }).then(unwrap),
  resetPassword: (token, new_password, confirm_password) =>
    api.post('/auth/reset-password', { token, new_password, confirm_password }).then(unwrap),
  changePassword: (payload) => api.post('/auth/change-password', payload).then(unwrap),
};
