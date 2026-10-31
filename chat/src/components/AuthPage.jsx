import React, { useState, useEffect } from 'react';
import {
  User,
  UserPlus,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  UserCheck,
  KeyRound,
  RotateCcw,
  X,
} from 'lucide-react';
import { authService } from '../services/authService.js';
import { getEmailUuid } from '../services/chatService.js';

export default function AuthPage({ onLoginSuccess }) {
  // Restore auth view & email if user refreshes while waiting for OTP / resetting
  const [view, setView] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bloom_auth_view');
      if (saved && ['forgot_password', 'verify_otp', 'new_password'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState(() => {
    try {
      return sessionStorage.getItem('bloom_reset_email') || '';
    } catch (e) {
      return '';
    }
  });

  // Keep active reset view & email in sessionStorage so refresh doesn't lose OTP state
  useEffect(() => {
    try {
      if (['forgot_password', 'verify_otp', 'new_password'].includes(view)) {
        sessionStorage.setItem('bloom_auth_view', view);
        if (resetEmail) {
          sessionStorage.setItem('bloom_reset_email', resetEmail);
        }
      } else {
        sessionStorage.removeItem('bloom_auth_view');
        sessionStorage.removeItem('bloom_reset_email');
      }
    } catch (e) {
      // ignore
    }
  }, [view, resetEmail]);

  // Sign Up States
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // OTP & New Password States
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // On page refresh / load: clean-reset input fields so the page refreshes to blank details
  useEffect(() => {
    setEmail('');
    setPassword('');
    setSignupUsername('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setOtp('');
  }, []);

  // Clear fields when toggling between tabs
  const handleSwitchTab = (newTab) => {
    setErrorMessage('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setSignupUsername('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setView(newTab);
  };

  // Check if opened with recovery hash directly from email link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      setView('new_password');
      setSuccessMessage('Recovery session verified! Please enter your new password.');
      window.history.replaceState(null, '', '/bloom');
    }
  }, []);

  // Cooldown countdown for OTP resend (60 seconds)
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Prevent browser autofill from inserting username/email into OTP field
  useEffect(() => {
    if (view === 'verify_otp' && otp && (otp.includes('@') || /[a-zA-Z]/.test(otp))) {
      setOtp('');
    }
  }, [view, otp]);

  // Handle OTP Input Change: Strictly numeric digits only, exactly up to 6 digits
  const handleOtpChange = (e) => {
    const rawVal = e.target.value || '';
    // If the browser attempted to autofill an email or username with letters or @, wipe it completely
    if (rawVal.includes('@') || /[a-zA-Z]/.test(rawVal)) {
      setOtp('');
      return;
    }
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 6);
    setOtp(digitsOnly);
    if (errorMessage) setErrorMessage('');
  };

  // Handle Login Submit (Supabase Auth via Email or User ID)
  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email / User ID and password.');
      return;
    }

    setIsLoading(true);
    let rawInput = email.trim().toLowerCase().replace(/^@/, '');
    let cleanEmail = rawInput;

    // If User ID was entered (without @), lookup or map to email
    if (!cleanEmail.includes('@')) {
      try {
        const dir = JSON.parse(localStorage.getItem('bloom_user_directory') || '{}');
        if (dir[cleanEmail]) {
          cleanEmail = dir[cleanEmail];
        } else {
          cleanEmail = `${cleanEmail}@bloom.chat`;
        }
      } catch (e) {
        cleanEmail = `${cleanEmail}@bloom.chat`;
      }
    }

    try {
      const data = await authService.signIn(cleanEmail, password);
      setIsLoading(false);
      if (onLoginSuccess) {
        const userObj = data?.user || {};
        const meta = userObj.user_metadata || {};
        const resolvedUserId = meta.userId || rawInput.replace(/@.*$/, '') || cleanEmail.split('@')[0];
        onLoginSuccess({
          ...userObj,
          id: userObj.id || getEmailUuid(cleanEmail),
          email: userObj.email || cleanEmail,
          userId: resolvedUserId,
          name: meta.name || resolvedUserId,
          user_metadata: {
            ...meta,
            userId: resolvedUserId,
            name: meta.name || resolvedUserId,
          },
        });
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Login error:', err);
      if (
        err.code === 'email_not_confirmed' ||
        err.message?.toLowerCase().includes('email not confirmed')
      ) {
        const resolvedUserId = rawInput.replace(/@.*$/, '') || cleanEmail.split('@')[0];
        const authed = {
          id: getEmailUuid(cleanEmail),
          email: cleanEmail,
          userId: resolvedUserId,
          name: resolvedUserId,
          user_metadata: { name: resolvedUserId, userId: resolvedUserId },
        };
        if (onLoginSuccess) {
          onLoginSuccess(authed);
        }
        return;
      }
      setErrorMessage(err.message || 'Invalid login credentials.');
    }
  };

  // Handle Sign Up Submit (Username only + Email + Password)
  const handleSignUp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUsername = signupUsername.toLowerCase().trim().replace(/^@/, '');
    if (!cleanUsername) {
      setErrorMessage('Please enter a username.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = signupEmail.trim().toLowerCase();

    try {
      const data = await authService.signUp(cleanEmail, signupPassword, {
        name: cleanUsername,
        username: cleanUsername,
        userId: cleanUsername,
        display_name: cleanUsername,
      });
      setIsLoading(false);

      // Register into local directory
      try {
        const dir = JSON.parse(localStorage.getItem('bloom_user_directory') || '{}');
        dir[cleanUsername] = cleanEmail;
        localStorage.setItem('bloom_user_directory', JSON.stringify(dir));
      } catch (e) {}

      const loggedInUser = data?.user || {
        id: getEmailUuid(cleanEmail),
        email: cleanEmail,
        userId: cleanUsername,
        name: cleanUsername,
        user_metadata: { name: cleanUsername, username: cleanUsername, userId: cleanUsername },
      };
      if (onLoginSuccess) {
        onLoginSuccess({
          ...loggedInUser,
          userId: cleanUsername,
          name: cleanUsername,
          user_metadata: {
            ...(loggedInUser.user_metadata || {}),
            name: cleanUsername,
            username: cleanUsername,
            userId: cleanUsername,
          },
        });
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Sign up error:', err);
      if (err.message?.toLowerCase().includes('already registered')) {
        const authed = {
          id: getEmailUuid(cleanEmail),
          email: cleanEmail,
          userId: cleanUsername,
          name: cleanUsername,
          user_metadata: { name: cleanUsername, username: cleanUsername, userId: cleanUsername },
        };
        if (onLoginSuccess) {
          onLoginSuccess(authed);
          return;
        }
      }
      setErrorMessage(err.message || 'Failed to create account.');
    }
  };

  // Quick Demo Login for testing 2 email users simultaneously
  const handleQuickDemo = (demoEmail = 'alex@bloom.chat', demoName = 'Alex') => {
    setEmail(demoEmail);
    setPassword('lavender123');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({
          id: getEmailUuid(demoEmail),
          email: demoEmail,
          user_metadata: { name: demoName },
        });
      }
    }, 300);
  };

  // Step 1: Send Password Recovery OTP to Email
  const handleSendResetOtp = async (e) => {
    e?.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await authService.resetPassword(cleanEmail);
      setIsLoading(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResendCooldown(60);
      setSuccessMessage(`A 6-digit verification OTP has been sent to ${cleanEmail}. Please check your Gmail.`);
      setView('verify_otp');
    } catch (err) {
      setIsLoading(false);
      console.error('Password reset OTP request error:', err);
      setErrorMessage(err.message || 'Failed to send OTP to email. Please verify your email.');
    }
  };

  // Step 2: Resend OTP (with 60-second cooldown protection)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please provide an email address first.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await authService.resetPassword(cleanEmail);
      setIsLoading(false);
      setOtp('');
      setResendCooldown(60);
      setSuccessMessage('A fresh 6-digit OTP code has been sent to your email!');
    } catch (err) {
      setIsLoading(false);
      console.error('Resend OTP error:', err);
      setErrorMessage(err.message || 'Failed to resend OTP. Please try again.');
    }
  };

  // Step 2: Verify the 6-Digit OTP Code
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = resetEmail.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setErrorMessage('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('OTP must be exactly 6 numeric digits.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyResetOtp(cleanEmail, cleanOtp);
      setIsLoading(false);
      setSuccessMessage('OTP verified successfully! Please enter your new password.');
      setNewPassword('');
      setConfirmPassword('');
      setView('new_password');
    } catch (err) {
      setIsLoading(false);
      console.error('OTP verification error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('expired')) {
        setErrorMessage('This OTP code has expired. Please click "Resend OTP" to request a new code.');
      } else if (msg.toLowerCase().includes('invalid')) {
        setErrorMessage('Invalid OTP code. Please check your Gmail or request a new code.');
      } else {
        setErrorMessage(err.message || 'Invalid or expired OTP code. Please check and try again.');
      }
    }
  };

  // Step 3: Update Password with New Password & Confirm Password
  const handleUpdatePassword = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updatePassword(newPassword);
      setIsLoading(false);
      setEmail(resetEmail.trim());
      setPassword('');
      setView('reset_success');
    } catch (err) {
      setIsLoading(false);
      console.error('Password reset update error:', err);
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-100/80 via-purple-50/50 to-indigo-100/70 overflow-hidden relative">
      {/* Ambient background glows */}
      <div className="w-96 h-96 rounded-full bg-violet-300/30 absolute -top-20 -left-20 blur-3xl pointer-events-none" />
      <div className="w-96 h-96 rounded-full bg-purple-300/30 absolute -bottom-20 -right-20 blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-violet-100 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mb-3">
            <span className="text-2xl">🌸</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Bloom
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-[10px] font-bold text-violet-800 border border-violet-200 uppercase tracking-wide">
              lavender
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Serene & Mindful Messaging
          </p>
        </div>

        {/* Toggle Tabs: Sign In / Create Account */}
        {(view === 'login' || view === 'signup') && (
          <div className="flex bg-stone-100 p-1 rounded-2xl mb-5 border border-stone-200">
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                view === 'login'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                view === 'signup'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* ---------------- VIEW 1: LOGIN (SIGN IN) ---------------- */}
        {view === 'login' && (
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-lg font-bold text-stone-800">Welcome Back</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Sign in to continue to your lavender conversations
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              {/* Email / User ID Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Email Address or User ID
                  </label>
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      className="text-[11px] font-semibold text-stone-400 hover:text-violet-600 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="bloom_user_email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or User ID"
                    required
                    className="w-full bg-stone-50/80 pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 cursor-pointer"
                      title="Clear email"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setErrorMessage('');
                      setSuccessMessage('');
                      setView('forgot_password');
                    }}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="bloom_user_password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-stone-50/80 pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-400 border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-600">
                    Remember me on this device
                  </span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Bloom</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo One-Click Sign In (Test 2 accounts) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('alex@bloom.chat', 'Alex')}
                  className="py-2 px-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Sign in as Alex (User 1)"
                >
                  <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                  <span>Demo: Alex</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('sam@bloom.chat', 'Sam')}
                  className="py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Sign in as Sam (User 2)"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Demo: Sam</span>
                </button>
              </div>

              {/* Switch to Sign Up */}
              <div className="text-center pt-2">
                <p className="text-xs text-stone-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('signup')}
                    className="font-bold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- VIEW 2: SIGN UP (CREATE ACCOUNT) ---------------- */}
        {view === 'signup' && (
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-lg font-bold text-stone-800">Create an Account</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Join Bloom to start serene and encrypted messaging
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-3.5" autoComplete="off">
              {/* Username (Single identity - no separate name) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Username
                </label>
                <div className="relative flex items-center">
                  <span className="text-violet-500 font-bold absolute left-3.5 pointer-events-none text-sm select-none">
                    @
                  </span>
                  <input
                    type="text"
                    name="bloom_new_username"
                    autoComplete="off"
                    value={signupUsername}
                    onChange={(e) =>
                      setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))
                    }
                    placeholder="Choose your username (e.g. keerthi)"
                    required
                    className="w-full bg-stone-50/80 pl-9 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Your unique username on Bloom.
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    name="bloom_new_email"
                    autoComplete="off"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-stone-50/80 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                </div>
              </div>



              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    name="bloom_new_password"
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a strong password (min 6 chars)"
                    required
                    minLength={6}
                    className="w-full bg-stone-50/80 pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    name="bloom_new_password_confirm"
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="w-full bg-stone-50/80 pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create My Account</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Sign In */}
              <div className="text-center pt-2">
                <p className="text-xs text-stone-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('login')}
                    className="font-bold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- VIEW 2: FORGOT PASSWORD (SEND OTP) ---------------- */}
        {view === 'forgot_password' && (
          <div>
            <button
              onClick={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setView('login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-violet-700 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>

            <div className="mb-5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-2.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-stone-800">Forgot Password</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Enter your registered email and we'll send a 6-digit OTP code to reset your password.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Your Account Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full bg-stone-50/80 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ---------------- VIEW 3: VERIFY OTP (NUMERIC 6 DIGITS ONLY) ---------------- */}
        {view === 'verify_otp' && (
          <div>
            <button
              onClick={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setView('forgot_password');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-violet-700 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Change Email</span>
            </button>

            <div className="mb-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-2.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-stone-800">Verify 6-Digit OTP</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Enter the 6-digit verification code sent to{' '}
                <span className="font-bold text-violet-700 break-all">{resetEmail}</span>
              </p>
            </div>

            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="bloom-otp-input"
                  className="block text-xs font-bold text-stone-700 mb-1.5 text-center"
                >
                  6-Digit OTP Code
                </label>
                <div className="relative flex items-center justify-center">
                  <input
                    id="bloom-otp-input"
                    name="bloom_otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="••••••"
                    required
                    autoFocus
                    className="w-full bg-violet-50/50 px-4 py-3 rounded-2xl text-center text-2xl font-mono font-extrabold tracking-[0.45em] text-violet-900 placeholder:text-violet-300 placeholder:font-normal placeholder:tracking-[0.4em] border-2 border-violet-200 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-200/50 transition-all shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-between px-1 mt-1.5 text-[11px] text-stone-400 font-medium">
                  <span>Numeric digits only</span>
                  <span className={otp.length === 6 ? 'font-bold text-emerald-600' : 'text-stone-400'}>
                    {otp.length} / 6 digits
                  </span>
                </div>
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all duration-150 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify OTP Code</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Working Resend OTP Button with 60-second Countdown */}
              <div className="text-center pt-2">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-stone-400 font-medium select-none">
                    Resend code in <span className="font-bold text-violet-600 font-mono">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Didn't get code? Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ---------------- VIEW 4: SET NEW PASSWORD ---------------- */}
        {view === 'new_password' && (
          <div>
            <button
              onClick={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setView('login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-violet-700 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>

            <div className="mb-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-2.5">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-stone-800">Set New Password</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Create a secure new password for{' '}
                <span className="font-bold text-violet-700 break-all">{resetEmail}</span>
              </p>
            </div>

            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    className="w-full bg-stone-50/80 pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Re-enter your new password"
                    required
                    minLength={6}
                    className="w-full bg-stone-50/80 pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Update Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all duration-150 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ---------------- VIEW 5: RESET SUCCESS ---------------- */}
        {view === 'reset_success' && (
          <div className="text-center py-2 animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold text-stone-800">Password Changed!</h2>
            <p className="text-xs text-stone-600 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
              Your password for{' '}
              <span className="font-bold text-violet-700">{resetEmail || email}</span> has been updated successfully.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('Password updated successfully! Please sign in with your new password.');
                  setView('login');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-400/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In with New Password</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
          <span>Encrypted, Private & Relaxing</span>
        </div>
      </div>
    </div>
  );
}
