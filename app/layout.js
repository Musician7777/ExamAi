import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './providers/ThemeProvider';
import AuthProvider from './providers/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'ExamAI – AI-Powered Exam & Interview Generation',
  description: 'Generate realistic exams, coding tests, and AI-powered interview simulations for government exams, private hiring, and campus placements.',
  keywords: 'exam generator, AI interview, coding test, UPSC, SSC, placement, hiring assessment',
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
  },
  openGraph: {
    title: 'ExamAI – AI-Powered Exam & Interview Generation',
    description: 'Generate realistic exams, coding tests, and AI-powered interview simulations for government exams, private hiring, and campus placements.',
    siteName: 'ExamAI',
    type: 'website',
    images: [
      {
        url: '/Logo.png',
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
    images: ['/Logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
