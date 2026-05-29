'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Clock, HelpCircle, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <Badge variant="brand" className="px-4 py-1.5 text-sm gap-1.5 mb-6">
            <span>📬</span> Contact Us
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have a question, suggestion, or need support? We would love to hear from you. Our team is here to help you
            get the most out of ExamAI.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Mail,
                title: 'General Inquiries',
                desc: 'For questions about ExamAI, partnerships, or general feedback.',
                contact: 'support@examai.me',
                href: 'mailto:support@examai.me',
              },
              {
                icon: HelpCircle,
                title: 'Technical Support',
                desc: 'Experiencing a bug or need help with your account? Reach out to our tech team.',
                contact: 'support@examai.me',
                href: 'mailto:support@examai.me',
              },
              {
                icon: MessageSquare,
                title: 'Privacy Concerns',
                desc: 'Questions about your data, privacy rights, or cookie preferences.',
                contact: 'privacy@examai.me',
                href: 'mailto:privacy@examai.me',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="p-6 space-y-4 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  <a href={item.href} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                    {item.contact}
                  </a>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10 space-y-4">
              <Badge variant="brand" className="px-3 py-1">
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
              <p className="text-muted-foreground">Quick answers to common questions about ExamAI.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'What is ExamAI?',
                  a: "ExamAI is an AI-powered exam preparation platform that generates realistic exam papers, coding challenges, and interview simulations using Google's Gemini AI. It supports government exams (UPSC, SSC, Banking), private hiring assessments, coding tests, and interview preparation.",
                },
                {
                  q: 'Is ExamAI free to use?',
                  a: 'Yes! ExamAI offers a free tier that includes 3 exams per month, preset exam types, basic analytics, and support for MCQ, MSQ, NAT, and descriptive question types. For unlimited access and advanced features, you can upgrade to our Pro or Enterprise plans.',
                },
                {
                  q: 'How accurate are the AI-generated questions?',
                  a: 'Our AI generates questions that closely match real exam patterns in terms of structure, difficulty, and topic distribution. However, since all content is AI-generated, there may occasionally be inaccuracies. ExamAI is designed as a practice tool and should complement — not replace — official study materials.',
                },
                {
                  q: 'Can I upload my own exam papers for pattern analysis?',
                  a: 'Yes! You can upload previous year papers in PDF format. Our AI extracts the structure, topics, marking scheme, and difficulty distribution to generate new exams that faithfully replicate those patterns with original questions.',
                },
                {
                  q: 'How is my data protected?',
                  a: 'We take privacy seriously. Your data is stored in MongoDB Atlas with encrypted connections, passwords are bcrypt-hashed, and sessions use JWT tokens in HTTP-only cookies. We implement Google Consent Mode v2 and never sell your personal data. Read our full Privacy Policy for details.',
                },
                {
                  q: 'Can I delete my account?',
                  a: 'Yes. You can permanently delete your account and all associated data from the Profile & Settings page in your dashboard. This action is irreversible — all your exam history, analytics, and personal data will be removed.',
                },
                {
                  q: 'What coding languages are supported in the coding test module?',
                  a: 'Our integrated code editor supports multiple languages including JavaScript, Python, C++, and Java. Each coding challenge comes with automated test case evaluation and real-time feedback on your solutions.',
                },
                {
                  q: 'How does the AI interview simulator work?',
                  a: 'The AI interview simulator conducts realistic interviews with dynamic follow-up questions that adapt based on your responses. It supports technical interviews, HR rounds, and behavioral/personality interviews for both government positions and private sector roles.',
                },
              ].map((faq, i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Response Time */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto">
            <Clock className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold">
            We Typically Respond Within <span className="gradient-text">24 Hours</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Our team reads every email and aims to provide helpful, detailed responses. For urgent issues related to
            account access, please include your registered email address in your message so we can assist you faster.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <Card className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-br from-indigo-500/10 to-sky-500/5 border-indigo-500/20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Start Learning?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your free account and start practicing with AI-generated exams today.
          </p>
          <Link href="/register">
            <Button variant="brand" size="xl" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <Footer />
    </>
  );
}
