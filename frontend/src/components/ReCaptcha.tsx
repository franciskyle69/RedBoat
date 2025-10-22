import React, { useEffect, useRef, useState } from 'react';

interface ReCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal' | 'invisible';
  tabindex?: number;
  className?: string;
  id?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'compact' | 'normal' | 'invisible';
        tabindex?: number;
      }) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
      execute: (widgetId?: number) => void;
    };
  }
}

export function ReCaptcha({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  tabindex = 0,
  className = '',
  id = 'recaptcha'
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
        onError?.();
      };
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, [onError]);

  useEffect(() => {
    if (isLoaded && containerRef.current && !isRendered) {
      window.grecaptcha.ready(() => {
        try {
          const widgetId = window.grecaptcha.render(containerRef.current!, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            'expired-callback': () => {
              onExpire?.();
            },
            'error-callback': () => {
              onError?.();
            },
            theme,
            size,
            tabindex
          });
          
          widgetIdRef.current = widgetId;
          setIsRendered(true);
        } catch (error) {
          console.error('Failed to render reCAPTCHA:', error);
          onError?.();
        }
      });
    }
  }, [isLoaded, siteKey, onVerify, onExpire, onError, theme, size, tabindex, isRendered]);

  const reset = () => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  };

  const getResponse = () => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      return window.grecaptcha.getResponse(widgetIdRef.current);
    }
    return '';
  };

  const execute = () => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.execute(widgetIdRef.current);
    }
  };

  // Expose methods via ref
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    reset,
    getResponse,
    execute
  }));

  return (
    <div 
      ref={containerRef}
      id={id}
      className={`recaptcha-container ${className}`}
      style={{
        margin: '10px 0',
        display: 'flex',
        justifyContent: 'center'
      }}
    />
  );
}

// Hook for using reCAPTCHA
export function useReCaptcha() {
  const [token, setToken] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = (recaptchaToken: string) => {
    setToken(recaptchaToken);
    setIsVerified(true);
  };

  const handleExpire = () => {
    setToken('');
    setIsVerified(false);
  };

  const handleError = () => {
    setToken('');
    setIsVerified(false);
  };

  const reset = () => {
    setToken('');
    setIsVerified(false);
  };

  return {
    token,
    isVerified,
    handleVerify,
    handleExpire,
    handleError,
    reset
  };
}

export default ReCaptcha;
