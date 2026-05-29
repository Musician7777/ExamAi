'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Code,
  MessageSquare,
  BarChart3,
  Users,
  Target,
  Lightbulb,
  Shield,
  ArrowRight,
  Sparkles,
  Globe,
  BookOpen,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sky-500/8 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <Badge variant="brand" className="px-4 py-1.5 text-sm gap-1.5 mb-6">
            <span>🏢</span> About ExamAI
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Empowering Learners with
            <br />
            <span className="gradient-text">AI-Driven Assessments</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ExamAI was born from a simple idea: every student and professional deserves access to high-quality,
            realistic exam practice — powered by cutting-edge artificial intelligence.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="brand" className="px-3 py-1">
                Our Mission
              </Badge>
              <h2 className="text-3xl font-bold">
                Democratizing <span className="gradient-text">Exam Preparation</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Traditional exam preparation is expensive, inaccessible, and often one-size-fits-all. Coaching centers
                charge thousands, question banks go stale, and students in remote areas rarely get the same quality of
                practice as those in metro cities.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We are changing that. ExamAI leverages Google&apos;s Gemini AI to generate unlimited, realistic exam
                papers that match the exact patterns and difficulty levels of real examinations — from UPSC and SSC to
                tech company coding tests and behavioral interviews.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you are a government exam aspirant in a small town, a computer science student preparing for
                campus placements, or a professional switching careers, ExamAI gives you the same quality of practice
                material that was once available only to a privileged few.
              </p>
            </div>
            <Card className="p-8 space-y-6 bg-gradient-to-br from-indigo-500/5 to-sky-500/5 border-indigo-500/10">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Target, label: 'Exam Categories', value: '6+' },
                  { icon: Users, label: 'Question Types', value: '4' },
                  { icon: Globe, label: 'Accessible', value: '24/7' },
                  { icon: Sparkles, label: 'AI Powered', value: 'Gemini' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto">
                        <Icon className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              What We Offer
            </Badge>
            <h2 className="text-3xl font-bold">
              A Complete <span className="gradient-text">Assessment Ecosystem</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              ExamAI is more than just a question bank — it is an intelligent, adaptive platform that evolves with your
              learning journey.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GraduationCap,
                title: 'Structured Exams',
                desc: 'AI generates complete exam papers matching the structure, sections, and difficulty of real government and private exams like UPSC, SSC CGL, IBPS PO, and campus placement tests.',
              },
              {
                icon: Code,
                title: 'Coding Challenges',
                desc: 'Practice DSA, debugging, and system design problems in our integrated code editor with automated test case evaluation and real-time feedback on your solutions.',
              },
              {
                icon: MessageSquare,
                title: 'Interview Simulator',
                desc: 'Prepare for technical, HR, and behavioral interviews with AI-powered dynamic conversations that adapt based on your responses — just like a real interview.',
              },
              {
                icon: BarChart3,
                title: 'Smart Analytics',
                desc: 'Track your accuracy, speed, strengths, and weaknesses over time. Get AI-powered improvement recommendations and see how you rank among other learners.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="p-6 space-y-3 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              Our Values
            </Badge>
            <h2 className="text-3xl font-bold">
              What <span className="gradient-text">Drives Us</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Lightbulb,
                title: 'Innovation First',
                desc: 'We push the boundaries of what AI can do in education. Our platform continuously improves with the latest advancements in generative AI to provide the most realistic and helpful exam practice experience possible.',
              },
              {
                icon: Shield,
                title: 'Privacy Focused',
                desc: 'Your data belongs to you. We use Google Consent Mode v2, never sell your personal information, and give you full control over your analytics preferences. We believe privacy and great product experiences can coexist.',
              },
              {
                icon: BookOpen,
                title: 'Access for All',
                desc: 'Education should not be gatekept by geography or finances. ExamAI offers a generous free tier so that every student — regardless of their background — can access AI-powered exam preparation tools.',
              },
            ].map((value, i) => {
              const Icon = value.icon;
              return (
                <Card key={i} className="p-8 text-center space-y-4 hover:shadow-lg transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center mx-auto">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works — Brief */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              Our Technology
            </Badge>
            <h2 className="text-3xl font-bold">
              Built with <span className="gradient-text">Modern Tech</span>
            </h2>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">AI-Powered Question Generation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ExamAI uses Google&apos;s Gemini AI models to generate exam questions that match the structure,
                difficulty, and topic distribution of real examinations. When you upload a previous year paper, our AI
                analyzes the pattern — sections, marking scheme, question types, and difficulty curve — and creates new
                questions that faithfully replicate those patterns while ensuring the content is original and fresh.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Adaptive Learning Analytics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every exam you take on ExamAI feeds into our analytics engine. We track your accuracy across topics,
                your time management patterns, and your improvement trajectory. The platform identifies your weak areas
                and recommends targeted practice, helping you focus your preparation time where it matters most.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Secure and Private by Design</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ExamAI is built on Next.js with MongoDB Atlas for encrypted data storage, bcrypt password hashing,
                JWT-based authentication via NextAuth.js, and CSRF protection on all mutation endpoints. We implement
                Google Consent Mode v2 for analytics and advertising, ensuring compliance with privacy regulations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <Card className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-br from-indigo-500/10 to-sky-500/5 border-indigo-500/20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Start Preparing?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join ExamAI today and experience AI-powered exam preparation that adapts to your goals.
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
