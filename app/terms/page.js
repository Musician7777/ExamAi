'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { FileText, UserCheck, Scale, AlertTriangle, Ban, RefreshCw, Gavel, Mail } from 'lucide-react';

const sections = [
  {
    icon: <UserCheck className="h-5 w-5" />,
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: (
      <p className="text-muted-foreground leading-relaxed">
        By accessing or using ExamAI, you agree to be bound by these Terms of Service and our{' '}
        <Link href="/privacy" className="text-brand hover:underline">
          Privacy Policy
        </Link>
        . If you do not agree, do not use the platform. These terms apply to all visitors, users, and others who access
        ExamAI.
      </p>
    ),
  },
  {
    icon: <FileText className="h-5 w-5" />,
    id: 'description',
    title: '2. Description of Service',
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">ExamAI is an AI-powered platform that provides:</p>
        <ul className="space-y-2 text-muted-foreground mt-3">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>AI-generated exam papers for government, private hiring, and campus placement preparation</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Coding challenge module with an integrated code editor and automated test case evaluation</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>AI-powered interview simulations with dynamic follow-up questions</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Performance analytics, gamification features, and leaderboard rankings</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>PDF upload and pattern analysis for generating exams that mimic real-world formats</span>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-4">
          ExamAI uses AI (Google Gemini) to generate content. AI-generated questions and evaluations may contain
          inaccuracies. Content should be used for practice purposes and not as a substitute for official exam materials
          or professional advice.
        </p>
      </>
    ),
  },
  {
    icon: <Scale className="h-5 w-5" />,
    id: 'accounts',
    title: '3. User Accounts',
    content: (
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>You must provide accurate, complete information when creating an account.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>You are responsible for safeguarding your password and for all activity under your account.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            You must be at least 13 years old to use ExamAI. If you are under 18, you must have parental or guardian
            consent.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            You may not create multiple accounts to circumvent rate limits, free tier restrictions, or other platform
            safeguards.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            You may delete your account at any time from your profile settings. Deletion is permanent and irreversible.
          </span>
        </li>
      </ul>
    ),
  },
  {
    icon: <Ban className="h-5 w-5" />,
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          You agree not to misuse ExamAI. Specifically, you must not:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Use the platform for any unlawful purpose or to promote illegal activities</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              Attempt to gain unauthorized access to other users&apos; accounts, data, or system infrastructure
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Abuse rate limits or API endpoints (automated scraping, excessive requests, bot activity)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Upload content that contains malware, viruses, or harmful code</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Share or distribute AI-generated exam content as official examination material</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              Attempt to reverse-engineer, decompile, or extract the AI prompting logic or platform algorithms
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Harass, threaten, or impersonate other users on the platform</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: <FileText className="h-5 w-5" />,
    id: 'content-ownership',
    title: '5. Content & Intellectual Property',
    content: (
      <ul className="space-y-3 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Platform content:</strong> The ExamAI platform, its design, code,
            branding, and original content are owned by ExamAI and protected by intellectual property laws.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">AI-generated content:</strong> Exam questions, interview questions, and
            coding challenges generated by the AI are provided for your personal practice. You may not represent them as
            official exam papers or sell them.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Your content:</strong> You retain ownership of content you upload (e.g.,
            PDFs) and your own answers/responses. By uploading, you grant ExamAI a limited, non-exclusive license to
            process the content for the purpose of generating your requested exams.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Shared content:</strong> When you share exam results via a generated
            link, you acknowledge that anyone with the link can view the shared data. You are responsible for the
            content you choose to share.
          </span>
        </li>
      </ul>
    ),
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    id: 'disclaimers',
    title: '6. Disclaimers',
    content: (
      <ul className="space-y-3 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            ExamAI is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
            express or implied, including but not limited to merchantability, fitness for a particular purpose, or
            non-infringement.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">AI accuracy:</strong> AI-generated content may contain errors,
            inaccuracies, or outdated information. We do not guarantee the correctness, completeness, or reliability of
            any AI-generated exam questions, interview responses, or code evaluations.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Not a substitute:</strong> ExamAI is a practice and preparation tool. It
            is not a substitute for official exam preparation materials, professional certifications, or real-world
            interview evaluations.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>We do not guarantee uninterrupted or error-free operation of the platform.</span>
        </li>
      </ul>
    ),
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    id: 'limitations',
    title: '7. Limitation of Liability',
    content: (
      <p className="text-muted-foreground leading-relaxed">
        To the maximum extent permitted by applicable law, ExamAI and its operators shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data,
        loss of profits, or failure to pass any examination, arising out of or in connection with your use of or
        inability to use the platform.
      </p>
    ),
  },
  {
    icon: <Gavel className="h-5 w-5" />,
    id: 'termination',
    title: '8. Termination',
    content: (
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>You may stop using ExamAI at any time by deleting your account from your profile settings.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            We reserve the right to suspend or terminate your account if you violate these Terms, engage in abusive
            behavior, or for any reason at our discretion, with or without notice.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            Upon termination, your right to use the platform ceases immediately. Provisions that by their nature should
            survive (disclaimers, limitations, content licenses) remain in effect.
          </span>
        </li>
      </ul>
    ),
  },
  {
    icon: <Mail className="h-5 w-5" />,
    id: 'contact-terms',
    title: '9. Contact',
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          For questions about these Terms of Service, please contact us:
        </p>
        <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
          <p className="font-medium">ExamAI Legal Team</p>
          <p className="text-muted-foreground mt-1">
            Email:{' '}
            <a href="mailto:legal@examai.com" className="text-brand hover:underline">
              legal@examai.com
            </a>
          </p>
        </div>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-brand/5 blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Terms of <span className="gradient-text">Service</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Last updated: July 2025</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            These terms govern your use of ExamAI. Please read them carefully before using the platform.
          </p>
        </div>
      </section>

      {/* Quick Nav */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-brand/10 hover:text-brand text-xs font-medium text-muted-foreground transition-colors"
              >
                {s.icon}
                {s.title.replace(/^\d+\.\s/, '')}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          {sections.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                  {s.icon}
                </div>
                <h2 className="text-xl font-bold">{s.title}</h2>
              </div>
              {s.content}
            </div>
          ))}

          {/* Changes notice */}
          <div className="p-6 rounded-2xl border border-border bg-secondary/30">
            <h3 className="font-semibold mb-2">Changes to These Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Material changes will be posted on this page with
              an updated &quot;Last updated&quot; date. Your continued use of ExamAI after changes are posted
              constitutes acceptance of the revised terms.
            </p>
          </div>

          {/* Back links */}
          <div className="flex items-center justify-between pt-8 border-t border-border">
            <Link href="/privacy" className="text-sm text-brand hover:underline">
              ← Privacy Policy
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-brand transition-colors">
              Back to Home →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
