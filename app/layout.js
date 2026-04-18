import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './providers/ThemeProvider';
import AuthProvider from './providers/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'ExamAI – AI-Powered Exam & Interview Generation',
  description: 'Generate realistic exams, coding tests, and AI-powered interview simulations for government exams, private hiring, and campus placements.',
  keywords: 'exam generator, AI interview, coding test, UPSC, SSC, placement, hiring assessment',
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
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
