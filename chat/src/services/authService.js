import { supabase } from '../lib/supabaseClient.js';

/**
 * Supabase Auth Service for Bloom
 */
export const authService = {
  // Sign up with email & password
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email & password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  // Get current active session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Get currently logged-in user
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // Send password reset OTP email
  async resetPassword(email) {
    const cleanEmail = email?.trim ? email.trim() : email;
    const redirectUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/bloom` : undefined;
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
  },

  // Verify recovery OTP code from email
  async verifyResetOtp(email, token) {
    const cleanEmail = email?.trim ? email.trim() : email;
    const cleanToken = token?.trim ? token.trim() : token;
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    if (error) throw error;
    return data;
  },

  // Update password for currently authenticated or recovered session
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  // Alias for sending reset OTP
  async sendResetOtp(email) {
    return this.resetPassword(email);
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

