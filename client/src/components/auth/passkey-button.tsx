import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';

interface PasskeyButtonProps {
  onAuthenticate?: () => Promise<void>;
  onRegister?: () => Promise<void>;
  mode?: 'login' | 'register';
  disabled?: boolean;
  className?: string;
}

export function PasskeyButton({
  onAuthenticate,
  onRegister,
  mode = 'login',
  disabled = false,
  className = '',
}: PasskeyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      if (mode === 'login' && onAuthenticate) {
        await onAuthenticate();
      } else if (mode === 'register' && onRegister) {
        await onRegister();
      }
    } catch (error) {
      console.error('Passkey operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSupported = () => {
    return (
      typeof window !== 'undefined' &&
      'PublicKeyCredential' in window &&
      typeof PublicKeyCredential !== 'undefined' &&
      'isUserVerifyingPlatformAuthenticatorAvailable' in PublicKeyCredential &&
      'isConditionalMediationAvailable' in PublicKeyCredential
    );
  };

  if (!isSupported()) {
    return (
      <Button disabled variant="outline" className={`w-full ${className}`}>
        <Fingerprint className="w-4 h-4 mr-2" />
        Passkey not supported
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      variant="outline"
      className={`w-full ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      ) : (
        <Fingerprint className="w-4 h-4 mr-2" />
      )}
      {mode === 'login' ? 'Sign in with Passkey' : 'Register Passkey'}
    </Button>
  );
}
