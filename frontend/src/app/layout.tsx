import './global.css';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { MainLayout } from '@/components/layout/main-layout';
import { Header } from '@/components/layout/header';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationProvider } from '@/components/notifications';
import { OnboardingProvider } from '@/components/onboarding';
import { PrivacyProvider } from '@/components/privacy';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata = {
  title: 'Permoney - Personal Finance Intelligence',
  description: 'Comprehensive personal finance management for Indonesian households with multi-user support, multi-currency operations, and Islamic finance compliance.',
  keywords: ['finance', 'personal finance', 'budgeting', 'Indonesia', 'household', 'money management'],
  authors: [{ name: 'Permoney Team' }],
  creator: 'Permoney',
  publisher: 'Permoney',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Permoney',
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Permoney" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Permoney" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#22c55e" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Permoney - Personal Finance Intelligence" />
        <meta property="og:description" content="Comprehensive personal finance management for Indonesian households" />
        <meta property="og:site_name" content="Permoney" />
        <meta property="og:url" content="https://permoney.app" />
        <meta property="og:image" content="/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Permoney - Personal Finance Intelligence" />
        <meta name="twitter:description" content="Comprehensive personal finance management for Indonesian households" />
        <meta name="twitter:image" content="/twitter-image.png" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <ToastProvider>
              <NotificationProvider>
                <OnboardingProvider>
                  <PrivacyProvider>
                    <QueryProvider>
                      <MainLayout>
                        <Header />
                        {children}
                      </MainLayout>
                    </QueryProvider>
                  </PrivacyProvider>
                </OnboardingProvider>
              </NotificationProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
