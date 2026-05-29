import { FaGithub, FaTwitter, FaLinkedin, FaDiscord } from 'react-icons/fa';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import ManageCookiesLink from './ManageCookiesLink';
export default function Footer() {
  const socialLinks = [
    { icon: FaGithub, label: 'GitHub', href: 'https://github.com/examai' },
    { icon: FaTwitter, label: 'Twitter', href: 'https://twitter.com/examai' },
    { icon: FaLinkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/examai' },
    { icon: FaDiscord, label: 'Discord', href: 'https://discord.gg/examai' },
  ];

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold mb-3">
              Exam<span className="gradient-text">AI</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered exam generation and interview simulation platform. Built for aspirants, students, and hiring
              companies.
            </p>
            <div className="flex gap-2 mt-4">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold mb-1">Product</h4>
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link
              href="/dashboard/coding"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Coding Tests
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold mb-1">Exams</h4>
            <Link
              href="/dashboard/generate"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Government
            </Link>
            <Link
              href="/dashboard/generate"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Private Hiring
            </Link>
            <Link
              href="/dashboard/generate"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Campus Placement
            </Link>
            <Link
              href="/dashboard/interview"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Interviews
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold mb-1">Company</h4>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/contact#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
      <Separator />
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ExamAI. All rights reserved.</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <ManageCookiesLink />
        </div>
      </div>
    </footer>
  );
}
