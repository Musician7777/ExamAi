'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { Shield, Cookie, Database, Server, Mail, Users, Lock, BarChart3 } from 'lucide-react';

const sections = [
  {
    icon: <Database className="h-5 w-5" />,
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          We collect information you provide directly and information generated automatically when you use ExamAI.
        </p>

        <h3 className="text-base font-semibold mt-6 mb-3">Information You Provide</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Account information:</strong> Name, email address, and password
              (hashed) when you register. If you sign up with Google, we receive your Google profile name and email.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Profile data:</strong> Avatar image, display preferences, and theme
              settings.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Uploaded files:</strong> PDF documents you upload for exam pattern
              analysis. Files are processed server-side and not stored permanently.
            </span>
          </li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-3">Information Generated Automatically</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Activity data:</strong> Exam scores, question responses, time spent
              per question, coding challenge submissions, and interview performance summaries.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Gamification data:</strong> XP points, streak counts, earned badges,
              and leaderboard rankings.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Exam sessions:</strong> In-progress exam state (answers, current
              question, time remaining) is saved so you can resume interrupted exams.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Shared content:</strong> Exam results and presets you choose to share
              via unique links, including a view count.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: <Cookie className="h-5 w-5" />,
    id: 'cookies-and-tracking',
    title: '2. Cookies & Tracking Technologies',
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          We use cookies and similar technologies for essential functionality and, with your consent, analytics.
        </p>

        <div className="mt-4 rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 font-semibold">Category</th>
                <th className="text-left p-3 font-semibold">Purpose</th>
                <th className="text-left p-3 font-semibold">Consent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3 text-muted-foreground">Essential</td>
                <td className="p-3 text-muted-foreground">
                  Authentication sessions, CSRF protection, theme preferences
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    Always active
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-3 text-muted-foreground">Analytics (GA4)</td>
                <td className="p-3 text-muted-foreground">Page views, feature usage, performance metrics</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium">
                    Your choice
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold mt-6 mb-3">Google Analytics 4</h3>
        <p className="text-muted-foreground leading-relaxed">
          When you accept analytics cookies, we use Google Analytics 4 (GA4) to understand how users interact with
          ExamAI. GA4 uses Google Consent Mode v2 — analytics storage is{' '}
          <strong className="text-foreground">denied by default</strong> and only enabled after you click &quot;Accept
          analytics&quot; in our cookie banner.
        </p>
        <ul className="space-y-2 text-muted-foreground mt-3">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Data collected:</strong> Page views, session duration, device/browser
              type, approximate location (country/city level), and custom events listed below.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Custom events we track:</strong> exam generation, exam submission,
              interview start/completion, coding submission, sign-up, sign-in, result sharing, and PDF upload. These
              events include metadata like question count, score, and difficulty — never personal data.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Data retention:</strong> Google retains GA4 event data for 14 months
              by default, after which it is automatically deleted.
            </span>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          For more details, see{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            Google&apos;s Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://support.google.com/analytics/answer/12003057"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            How Google uses data in GA4
          </a>
          .
        </p>

        <h3 className="text-base font-semibold mt-6 mb-3">Local Storage</h3>
        <p className="text-muted-foreground leading-relaxed">
          We use your browser&apos;s localStorage and sessionStorage for client-side preferences that never leave your
          device:
        </p>
        <ul className="space-y-2 text-muted-foreground mt-3">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              Cookie consent choice (
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">examai_cookie_consent</code>)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Theme preference</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Saved exam presets</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Solved coding problem IDs</span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>Active exam session data (cleared after submission)</span>
          </li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-3">Managing Your Cookie Preferences</h3>
        <p className="text-muted-foreground leading-relaxed">
          You can change your cookie consent choice at any time from your{' '}
          <Link href="/dashboard/profile" className="text-brand hover:underline">
            profile settings
          </Link>{' '}
          page. The Cookie Preferences section lets you accept or decline analytics cookies and reset your preference to
          re-show the consent banner on your next visit.
        </p>
      </>
    ),
  },
  {
    icon: <Server className="h-5 w-5" />,
    id: 'how-we-use-information',
    title: '3. How We Use Your Information',
    content: (
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Provide and operate ExamAI — generating exams, running interviews, evaluating code submissions</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Save and resume in-progress exam sessions</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Track your performance history, streaks, and achievements</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Send password reset emails and email verification links via Resend</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Generate aggregated, anonymized analytics to improve the platform</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Enable sharing of exam results via unique, non-guessable links (only when you choose to share)</span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>Prevent abuse through rate limiting on API endpoints</span>
        </li>
      </ul>
    ),
  },
  {
    icon: <Lock className="h-5 w-5" />,
    id: 'data-storage-security',
    title: '4. Data Storage & Security',
    content: (
      <>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Database:</strong> Your data is stored in MongoDB Atlas with encrypted
              connections (TLS). Passwords are bcrypt-hashed — we never store plaintext passwords.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Authentication:</strong> Session tokens are managed by NextAuth.js
              with JWT-based sessions stored in HTTP-only cookies.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Email service:</strong> Transactional emails (password reset, email
              verification) are sent via Resend. We do not send marketing emails.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">AI processing:</strong> Exam questions, interview responses, and code
              evaluations are processed by Google Gemini AI. Prompts are stateless — we do not store your inputs in
              Google&apos;s systems beyond the processing request.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Uploaded PDFs:</strong> Files are parsed server-side for text
              extraction and immediately discarded. We do not retain uploaded files after processing.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-brand mt-1">•</span>
            <span>
              <strong className="text-foreground">Rate limiting:</strong> API endpoints are rate-limited to prevent
              abuse. Rate limit metadata is stored in memory on the server and not persisted.
            </span>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-4">
          While we take reasonable measures to protect your data, no system is perfectly secure. We encourage you to use
          a strong, unique password and to enable available security features.
        </p>
      </>
    ),
  },
  {
    icon: <Users className="h-5 w-5" />,
    id: 'third-party-services',
    title: '5. Third-Party Services',
    content: (
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-3 font-semibold">Service</th>
              <th className="text-left p-3 font-semibold">Purpose</th>
              <th className="text-left p-3 font-semibold">Data Shared</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="p-3">Google OAuth</td>
              <td className="p-3 text-muted-foreground">Sign-in / sign-up</td>
              <td className="p-3 text-muted-foreground">Name, email, profile picture</td>
            </tr>
            <tr>
              <td className="p-3">Google Gemini AI</td>
              <td className="p-3 text-muted-foreground">Exam generation, interview simulation, code evaluation</td>
              <td className="p-3 text-muted-foreground">Contextual prompts (no personal data)</td>
            </tr>
            <tr>
              <td className="p-3">Google Analytics 4</td>
              <td className="p-3 text-muted-foreground">Usage analytics (with your consent)</td>
              <td className="p-3 text-muted-foreground">Anonymized usage data, custom events</td>
            </tr>
            <tr>
              <td className="p-3">Resend</td>
              <td className="p-3 text-muted-foreground">Password reset &amp; email verification</td>
              <td className="p-3 text-muted-foreground">Email address, reset link</td>
            </tr>
            <tr>
              <td className="p-3">MongoDB Atlas</td>
              <td className="p-3 text-muted-foreground">Database storage</td>
              <td className="p-3 text-muted-foreground">All stored user data (encrypted in transit)</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    id: 'data-sharing',
    title: '6. Data Sharing & Disclosure',
    content: (
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            We <strong className="text-foreground">do not sell</strong> your personal data to anyone.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            We share data with third-party services only as described in Section 5 above, strictly to operate the
            platform.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Shared results:</strong> When you share exam results, a unique,
            non-guessable link is generated. Anyone with the link can view the shared data. You can delete shared links
            at any time from your dashboard.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Leaderboard:</strong> User names and scores may appear on the public
            leaderboard. You can opt out in your profile settings.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            We may disclose data if required by law or to protect the rights and safety of our users and the public.
          </span>
        </li>
      </ul>
    ),
  },
  {
    icon: <Shield className="h-5 w-5" />,
    id: 'your-rights',
    title: '7. Your Rights & Choices',
    content: (
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Cookie consent:</strong> You can accept or decline analytics cookies via
            the cookie banner or from the{' '}
            <Link href="/dashboard/profile" className="text-brand hover:underline">
              Cookie Preferences
            </Link>{' '}
            section in your profile settings. Your choice is remembered across sessions. You can also reset your
            preference from profile settings to re-show the consent banner.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Access your data:</strong> You can view your profile, activity history,
            and exam results from your dashboard at any time.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Update your data:</strong> You can edit your name, email, avatar, and
            other profile information from the profile settings page.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Delete your account:</strong> You can permanently delete your account
            and all associated data from the profile settings page. This action is irreversible.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Opt out of analytics:</strong> Decline analytics cookies, use browser
            tracking protection, or install a GA4 opt-out extension.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-brand mt-1">•</span>
          <span>
            <strong className="text-foreground">Data portability:</strong> You can export your activity data by
            contacting us.
          </span>
        </li>
      </ul>
    ),
  },
  {
    icon: <Mail className="h-5 w-5" />,
    id: 'contact',
    title: '8. Contact Us',
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          If you have questions about this privacy policy or your personal data, please contact us at:
        </p>
        <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
          <p className="font-medium">ExamAI Privacy Team</p>
          <p className="text-muted-foreground mt-1">
            Email:{' '}
            <a href="mailto:privacy@examai.com" className="text-brand hover:underline">
              privacy@examai.com
            </a>
          </p>
        </div>
        <p className="text-muted-foreground leading-relaxed mt-4">
          We will respond to your request within 30 days. If you are not satisfied with our response, you have the right
          to lodge a complaint with your local data protection authority.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-brand/5 blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Privacy <span className="gradient-text">Policy</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Last updated: July 2025</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            At ExamAI, we take your privacy seriously. This policy explains what data we collect, how we use it, your
            choices, and how we keep it safe. We encourage you to read it carefully.
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
          {/* Intro */}
          <div className="p-6 rounded-2xl bg-brand/5 border border-brand/10">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This Privacy Policy applies to the ExamAI web application (&quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;) operated at examai.com and all related subdomains. It does not apply to third-party
              services that we link to or integrate with — please review their respective policies.
            </p>
          </div>

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
            <h3 className="font-semibold mb-2">Changes to This Policy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting
              the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of ExamAI
              after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </div>

          {/* Back links */}
          <div className="flex items-center justify-between pt-8 border-t border-border">
            <Link href="/" className="text-sm text-muted-foreground hover:text-brand transition-colors">
              ← Back to Home
            </Link>
            <Link href="/terms" className="text-sm text-brand hover:underline">
              Terms of Service →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
