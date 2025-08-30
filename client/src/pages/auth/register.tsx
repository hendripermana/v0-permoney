import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { PermoneyCard } from '@/components/permoney-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon, UserPlus, ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordValid = passwordRequirements.every(req =>
    req.test(formData.password)
  );
  const canSubmit = formData.username && isPasswordValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast({
        title: 'Invalid Password',
        description: 'Please meet all password requirements.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({
          title: 'Success!',
          description: 'Your account has been created successfully.',
        });
        setLocation('/dashboard');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Registration failed. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <PermoneyCard className="glassmorphism p-6 slide-up">
          <div className="text-center space-y-2 mb-6">
            <div className="mx-auto w-12 h-12 bg-neon-green rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-black" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              Create Account
            </div>
            <div className="text-muted-foreground">
              Join Permoney and take control of your finances
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => {
                    const isValid = req.test(formData.password);
                    return (
                      <div key={index} className="flex items-center text-xs">
                        <Check
                          className={cn(
                            'h-3 w-3 mr-2',
                            isValid
                              ? 'text-neon-green'
                              : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            isValid
                              ? 'text-neon-green'
                              : 'text-muted-foreground'
                          )}
                        >
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    'bg-background/50 border focus:border-neon-green pr-10',
                    formData.confirmPassword &&
                      !passwordsMatch &&
                      'border-red-500 focus:border-red-500'
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
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login">
                <span className="font-medium text-neon-green hover:text-neon-green/80 cursor-pointer transition-colors">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </PermoneyCard>

        {/* Terms */}
        <PermoneyCard className="mt-4 glassmorphism p-4">
          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </PermoneyCard>
      </div>
    </div>
  );
}
