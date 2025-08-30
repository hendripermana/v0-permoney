import { useState } from 'react';
import { Link } from 'wouter';
import { PermoneyCard } from '@/components/permoney-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  EyeIcon,
  EyeOffIcon,
  UserPlus,
  ArrowLeft,
  Check,
  Shield,
  Fingerprint,
  Smartphone,
  Zap,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';

const passwordRequirements = [
  {
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
  },
  { label: 'Contains number', test: (password: string) => /\d/.test(password) },
  {
    label: 'Contains special character',
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export default function ModernRegister() {
  const { register, socialLogin } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordValid = passwordRequirements.every(req =>
    req.test(formData.password)
  );
  const canSubmit =
    formData.username &&
    formData.email &&
    isPasswordValid &&
    passwordsMatch &&
    acceptedTerms &&
    acceptedPrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    setLoading(true);

    try {
      const success = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });

      if (!success) {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'apple') => {
    setSocialLoading(provider);
    try {
      await socialLogin(provider);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background geometric-bg theme-transition flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/">
            <div className="inline-flex items-center space-x-2 text-neon-green hover:text-neon-green/80 transition-colors cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">
            Join Permoney and take control of your finances
          </p>
        </div>

        {/* Main Registration Card */}
        <PermoneyCard className="glassmorphism p-6 slide-up">
          <div className="space-y-6">
            {/* Social Signup Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => handleSocialLogin('google')}
                disabled={!!socialLoading}
                className="w-full bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                variant="outline"
              >
                {socialLoading === 'google' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Sign up with Google
              </Button>

              <Button
                onClick={() => handleSocialLogin('github')}
                disabled={!!socialLoading}
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
                variant="outline"
              >
                {socialLoading === 'github' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                Sign up with GitHub
              </Button>

              <Button
                onClick={() => handleSocialLogin('apple')}
                disabled={!!socialLoading}
                className="w-full bg-black text-white hover:bg-gray-900"
                variant="outline"
              >
                {socialLoading === 'apple' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                )}
                Sign up with Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with email
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="bg-background/50 border focus:border-neon-green"
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="bg-background/50 border focus:border-neon-green"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="bg-background/50 border focus:border-neon-green"
                  placeholder="Choose a username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="bg-background/50 border focus:border-neon-green"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-background/50 border focus:border-neon-green pr-10"
                    placeholder="Create a strong password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Password Requirements */}
                <div className="space-y-2 mt-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    Password requirements:
                  </p>
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check
                          className={cn(
                            'h-3 w-3',
                            req.test(formData.password)
                              ? 'text-neon-green'
                              : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs',
                            req.test(formData.password)
                              ? 'text-neon-green'
                              : 'text-muted-foreground'
                          )}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className={cn(
                      'bg-background/50 border pr-10',
                      passwordsMatch && formData.confirmPassword
                        ? 'border-neon-green focus:border-neon-green'
                        : formData.confirmPassword
                          ? 'border-red-500 focus:border-red-500'
                          : 'focus:border-neon-green'
                    )}
                    placeholder="Confirm your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Terms and Privacy */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={checked =>
                      setAcceptedTerms(checked as boolean)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <Link href="/terms">
                      <span className="text-neon-green hover:text-neon-green/80 cursor-pointer">
                        Terms of Service
                      </span>
                    </Link>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={checked =>
                      setAcceptedPrivacy(checked as boolean)
                    }
                  />
                  <Label htmlFor="privacy" className="text-sm">
                    I agree to the{' '}
                    <Link href="/privacy">
                      <span className="text-neon-green hover:text-neon-green/80 cursor-pointer">
                        Privacy Policy
                      </span>
                    </Link>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full button-solid disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            {/* Security Features */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-neon-green" />
                <span>Bank-level security encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Fingerprint className="w-4 h-4 text-neon-green" />
                <span>Passkey support coming soon</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4 text-neon-green" />
                <span>Two-factor authentication available</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-neon-green" />
                <span>Your data is protected and private</span>
              </div>
            </div>
          </div>
        </PermoneyCard>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login">
              <span className="font-medium text-neon-green hover:text-neon-green/80 cursor-pointer transition-colors">
                Sign in
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
