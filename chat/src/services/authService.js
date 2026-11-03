import { supabase } from '../lib/supabaseClient.js';

/**
 * Supabase Auth Service for Bloom
 */
export const authService = {
  // Check if a username is already taken (case-insensitive)
  async checkUsernameAvailability(username) {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    if (!clean) return { available: false, error: 'Username is required.' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, name')
        .or(`username.ilike.${clean},name.ilike.${clean}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        return {
          available: false,
          error: `Username "@${clean}" is already taken. Please choose another username.`,
        };
      }
    } catch (err) {
      console.warn('checkUsernameAvailability notice:', err);
    }

    return { available: true };
  },

  // Check if an email already has a registered username (Strict 1 Email = 1 Username rule)
  async checkEmailAvailability(email) {
    const clean = (email || '').toLowerCase().trim();
    if (!clean) return { available: false, error: 'Email is required.' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('email', clean)
        .limit(1);

      if (!error && data && data.length > 0) {
        const assignedUsername = data[0].username || data[0].name;
        return {
          available: false,
          existingUsername: assignedUsername,
          error: `This email is already registered with username "@${assignedUsername}". Each email can only have one username. Please sign in instead.`,
        };
      }
    } catch (err) {
      console.warn('checkEmailAvailability notice:', err);
    }

    return { available: true };
  },

  // Lookup email address associated with a username (for User ID login)
  async lookupEmailByUsername(username) {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    if (!clean) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, username')
        .or(`username.ilike.${clean},name.ilike.${clean}`)
        .limit(1);

      if (!error && data && data.length > 0 && data[0].email) {
        return data[0].email.toLowerCase().trim();
      }
    } catch (err) {
      console.warn('lookupEmailByUsername notice:', err);
    }
    return null;
  },

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

