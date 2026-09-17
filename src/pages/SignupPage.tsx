import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const requestedRedirect = new URLSearchParams(window.location.search).get('redirect');
  const redirectPath = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/account';
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  // const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null; message: React.ReactNode }>({
    type: null,
    message: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Sign Up – BLOM Cosmetics';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Create a BLOM Cosmetics account to shop faster, track orders, and manage your profile.');
    }
    window.scrollTo({ top: 0 });
  }, []);

  // Check if user is already logged in and redirect to account page
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectPath);
      }
    };

    checkSession();
  }, [navigate, redirectPath]);

  useEffect(() => {
    // Validate form
    const errors: string[] = [];
    
    // Email validation
    if (formData.email && (!formData.email.includes('@') || !formData.email.includes('.'))) {
      errors.push('Please enter a valid email address');
    }
    
    // Password validation
    if (formData.password && formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    // Password confirmation
    if (formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm) {
      errors.push('Passwords do not match');
    }
    
    // Terms agreement
    if (!formData.agreeToTerms) {
      errors.push('You must agree to the Terms and Privacy Policy');
    }

    setValidationErrors(errors);
    
    const isValid = formData.email.includes('@') && 
                   formData.email.includes('.') && 
                   formData.password.length >= 8 &&
                   formData.password === formData.passwordConfirm &&
                   formData.agreeToTerms;
    
    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear status when user starts typing
    if (status.type) {
      setStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, phone: formData.phone },
          emailRedirectTo: `${window.location.origin}${redirectPath}`
        }
      });

      if (error) {
        // Check if the error is due to email already being registered
        if (error.message.includes('User already registered')) {
          setStatus({
            type: 'error',
            message: (
              <>
                This email is already registered.{' '}
                <a
                  href={loginHref}
                  className="underline font-medium hover:text-red-800 transition-colors"
                >
                  Click here to log in
                </a>
                .
              </>
            )
          });
        } else {
          setStatus({ type: 'error', message: error.message });
        }
        setIsSubmitting(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setStatus({ 
          type: 'success', 
          message: 'Account created! Please check your email and click the confirmation link to activate your account. You can then log in.' 
        });
        setIsSubmitting(false);
        return;
      }

      const user = data.user;
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          name: formData.name,
          phone: formData.phone
        }, { onConflict: 'id' });

        // Save contact info to contacts system for marketing
        try {
          await fetch('/.netlify/functions/contacts-intake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              phone: formData.phone || '',
              source: 'account_creation'
            })
          });
        } catch (contactError) {
          // Don't block signup if contact save fails
          console.warn('Failed to save contact info:', contactError);
        }
      }

      setStatus({ type: 'success', message: 'Account created successfully! Redirecting to your account...' });
      setIsSubmitting(false);
      // Send new users to Log in, then back to account after auth
      setTimeout(() => { window.location.href = loginHref; }, 600);
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Something went wrong' });
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Fair', color: 'text-yellow-500' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 4, label: 'Strong', color: 'text-green-500' };
    }
    return { strength: 3, label: 'Good', color: 'text-blue-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showMobileMenu={true} />

      <main className="section-padding">
        <Container>
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Create Your Account</h1>
              <p className="text-xl text-gray-600">
                Join BLOM to shop faster and track your orders
              </p>
            </div>

            {/* Signup Form */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold text-center">Create Account</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="signupName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="signupName"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="e.g. Sarah Mitchell"
                      autoComplete="name"
                    />
                  </div>
                  {/* Email Field */}
                  <div>
                    <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="signupEmail"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="input-field pl-12"
                        placeholder="your@email.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="signupPassword"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                        className="input-field pl-12 pr-12"
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        aria-pressed={showPassword}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                                passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/4' :
                                passwordStrength.strength === 3 ? 'bg-blue-500 w-3/4' :
                                passwordStrength.strength === 4 ? 'bg-green-500 w-full' : 'w-0'
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Use 8+ characters with a mix of letters, numbers & symbols
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="signupPasswordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={'password'}
                        id="signupPasswordConfirm"
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleInputChange}
                        required
                        className="input-field pl-12 pr-12"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                      />
                      {/* Hide/show toggle removed for confirm field during testing */}
                    </div>
                    {/* Password Match Indicator */}
                    {formData.passwordConfirm && (
                      <div className="mt-2">
                        {formData.password === formData.passwordConfirm ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Passwords match
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Passwords do not match
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="signupPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="signupPhone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g. 082 123 4567"
                      autoComplete="tel"
                    />
                  </div>

                  {/* Terms Agreement */}
                  <div>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="signupTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required
                        className="mt-1 rounded border-gray-300 text-pink-400 focus:ring-pink-300"
                      />
                      <span className="text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="/terms" className="text-pink-400 hover:text-pink-500 transition-colors">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-pink-400 hover:text-pink-500 transition-colors">
                          Privacy Policy
                        </a>
                        *
                      </span>
                    </label>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && !isFormValid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-1">Please fix the following:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  {status.type && (
                    <div 
                      id="signupStatus" 
                      className={`form-status p-4 rounded-lg flex items-center gap-2 ${
                        status.type === 'error' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                      aria-live="polite"
                    >
                      {status.type === 'error' ? (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      )}
                      <span>{status.message}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    id="signupSubmit"
                    className="w-full flex items-center justify-center py-3"
                    size="lg"
                    disabled={!isFormValid || isSubmitting}
                    loading={isSubmitting}
                  >
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">{isSubmitting ? 'Creating...' : 'Create Account'}</span>
                  </Button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <a 
                      href={loginHref}
                      className="text-pink-400 hover:text-pink-500 font-medium transition-colors"
                    >
                      Log In
                    </a>
                  </p>
                </div>

                {/* Email Verification Notice */}
                {status.type === 'success' && status.message.includes('email') && (
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => { window.location.href = loginHref; }}
                    >
                      Go to Login
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};
