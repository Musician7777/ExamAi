import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from './providers/ThemeProvider';
import AuthProvider from './providers/AuthProvider';
import { ConsentProvider } from './providers/ConsentProvider';
import { AdsProvider } from './providers/AdsProvider';
import CookieConsent from './components/CookieConsent/CookieConsent';
import { ToastProvider } from './components/Toast/ToastProvider';
import FloatingCookieButton from './components/FloatingCookieButton/FloatingCookieButton';
import AdSenseScript from './components/AdBanner/AdSenseScript';
import PageViewTracker from './components/PageViewTracker/PageViewTracker';
import UserIdTracker from './components/UserIdTracker/UserIdTracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'ExamAI – AI-Powered Exam & Interview Generation',
  description:
    'Generate realistic exams, coding tests, and AI-powered interview simulations for government exams, private hiring, and campus placements.',
  keywords: 'exam generator, AI interview, coding test, UPSC, SSC, placement, hiring assessment',
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
  },
  openGraph: {
    title: 'ExamAI – AI-Powered Exam & Interview Generation',
    description:
      'Generate realistic exams, coding tests, and AI-powered interview simulations for government exams, private hiring, and campus placements.',
    siteName: 'ExamAI',
    type: 'website',
    images: [
      {
        url: '/coverImage.png',
        width: 1200,
        height: 630,
        alt: 'ExamAI – AI-Powered Exam & Interview Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExamAI – AI-Powered Exam & Interview Generation',
    description: 'Generate realistic exams, coding tests, and AI-powered interview simulations.',
    images: ['/coverImage.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent dark mode flash — set theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var VALID_THEMES = ['light','dark','simple-white','punchy','gradient','aurora','sunset','ocean','glass-dark','glass-light','frosted'];
                  var stored = localStorage.getItem('examai-theme');
                  if (stored && VALID_THEMES.indexOf(stored) > -1) {
                    document.documentElement.classList.add(stored);
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <AuthProvider>
          <ConsentProvider>
            <AdsProvider>
              <ThemeProvider>
                <ToastProvider position="top-right">
                  <UserIdTracker />
                  <PageViewTracker />
                  {children}
                </ToastProvider>
              </ThemeProvider>
              <AdSenseScript />
              <CookieConsent />
              <FloatingCookieButton />
            </AdsProvider>
          </ConsentProvider>
        </AuthProvider>
        {/* Google Consent Mode v2 — default denied, updated on user consent */}
        {!!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              id="gtag-consent-default"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('consent', 'default', {
                    'analytics_storage': 'denied',
                    'ad_storage': 'denied',
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied',
                    'wait_for_update': 500,
                    'url_passthrough': true,
                    'ads_data_redaction': true
                  });
                  // eslint-disable-next-line no-console
                  console.log('[GA4] Consent defaults configured');
                `,
              }}
            />
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="gtag-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    send_page_view: true
                  });
                  // eslint-disable-next-line no-console
                  console.log('[GA4] Consent Mode v2 initialized');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
