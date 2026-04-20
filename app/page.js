'use client';
import Link from 'next/link';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import { ArrowRight, Play, Check, GraduationCap, Upload, Settings, Code, UserCheck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const features = [
    {
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'text-indigo-400 bg-indigo-500/10',
      title: 'Preset Exam Generator',
      desc: 'Select from UPSC, SSC, Banking, Software Engineering, and more. AI generates structured exams matching real patterns.',
    },
    {
      icon: <Upload className="h-5 w-5" />,
      color: 'text-sky-400 bg-sky-500/10',
      title: 'Upload & Learn Patterns',
      desc: 'Upload previous year papers. Our AI extracts structure, topics, and difficulty to generate similar exams.',
    },
    {
      icon: <Settings className="h-5 w-5" />,
      color: 'text-emerald-400 bg-emerald-500/10',
      title: 'Custom Exam Builder',
      desc: 'Define your own structure — sections, questions, marking scheme, difficulty. AI fills in the questions.',
    },
    {
      icon: <Code className="h-5 w-5" />,
      color: 'text-orange-400 bg-orange-500/10',
      title: 'Coding Test Module',
      desc: 'Integrated code editor with DSA, debugging, and system design problems. Auto-evaluated with test cases.',
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      color: 'text-pink-400 bg-pink-500/10',
      title: 'AI Interview Simulator',
      desc: 'Practice technical, HR, and government personality interviews with dynamic AI follow-up questions.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-amber-400 bg-amber-500/10',
      title: 'Performance Analytics',
      desc: 'Track accuracy, speed, weak areas. Get AI-powered improvement recommendations and percentile ranking.',
    },
  ];

  const categories = [
    {
      emoji: '🏛️',
      title: 'Government Exams',
      desc: 'UPSC, SSC, Banking, Railways',
      tags: ['UPSC', 'SSC CGL', 'IBPS PO', 'RRB'],
    },
    {
      emoji: '💼',
      title: 'Private Hiring',
      desc: 'Tech companies & startups',
      tags: ['Software', 'Product', 'Startup', 'MNC'],
    },
    {
      emoji: '💻',
      title: 'Coding Tests',
      desc: 'DSA, System Design & more',
      tags: ['Arrays', 'Trees', 'DP', 'Design'],
    },
    {
      emoji: '🎤',
      title: 'Interviews',
      desc: 'Technical, HR & personality',
      tags: ['Technical', 'HR', 'Behavioral'],
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      desc: 'Get started with basics',
      price: '0',
      features: ['3 exams per month', 'Preset exam types', 'Basic analytics', 'MCQ, MSQ, NAT & Descriptive'],
      popular: false,
    },
    {
      name: 'Pro',
      desc: 'For serious aspirants',
      price: '19',
      features: [
        'Unlimited exams',
        'All exam types',
        'Coding test module',
        'AI interview simulator',
        'Advanced analytics',
        'Upload & learn patterns',
        'Priority support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      desc: 'For institutes & companies',
      price: '79',
      features: [
        'Everything in Pro',
        'Custom branding',
        'Bulk user management',
        'API access',
        'Dedicated support',
        'Custom exam blueprints',
        'Hiring assessment tools',
      ],
      popular: false,
    },
  ];

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sky-500/8 blur-[120px]" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-purple-500/8 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <Badge variant="brand" className="px-4 py-1.5 text-sm gap-1.5">
              <span>✨</span> AI-Powered Assessment Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Generate Real-World
              <br />
              <span className="gradient-text">Exams & Interviews</span>
              <br />
              with AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Create structured, realistic exams for government tests, private hiring, coding assessments, and
              AI-powered interview simulations — all in one platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button variant="brand" size="xl" className="gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/#features">
                <Button variant="outline" size="xl" className="gap-2">
                  <Play className="h-4 w-4" /> See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Card */}
          <div className="relative hidden lg:block">
            <Card className="p-6 space-y-4 backdrop-blur-sm bg-card/80">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">📝 SSC CGL Mock Test</h3>
                <Badge variant="success" className="gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Q12.</strong> If the ratio of ages of A and B is 3:5 and the sum of their ages is 48, what is
                  the age of B?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-lg bg-secondary text-sm">A) 18</div>
                  <div className="px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-sm text-indigo-300">
                    B) 30 ✓
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-secondary text-sm">C) 24</div>
                  <div className="px-3 py-2 rounded-lg bg-secondary text-sm">D) 36</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                <div className="text-center">
                  <span className="text-lg font-bold gradient-text">87%</span>
                  <br />
                  <span className="text-xs text-muted-foreground">Accuracy</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold gradient-text">42:15</span>
                  <br />
                  <span className="text-xs text-muted-foreground">Time Left</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold gradient-text">12/50</span>
                  <br />
                  <span className="text-xs text-muted-foreground">Answered</span>
                </div>
              </div>
            </Card>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-full bg-card border shadow-lg text-sm font-medium animate-[float_3s_ease-in-out_infinite]">
              🎯 98.5 Percentile
            </div>
            <div className="absolute top-1/2 -left-8 px-4 py-2 rounded-full bg-card border shadow-lg text-sm font-medium animate-[float_3s_ease-in-out_infinite_0.5s]">
              ⚡ AI Generated
            </div>
            <div className="absolute -bottom-4 right-8 px-4 py-2 rounded-full bg-card border shadow-lg text-sm font-medium animate-[float_3s_ease-in-out_infinite_1s]">
              📊 Real Patterns
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to
              <br />
              <span className="gradient-text">Ace Any Exam</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From government competitive exams to tech interviews — one platform covers it all.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card
                key={i}
                className="p-6 group hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Three Steps to
              <br />
              <span className="gradient-text">Your Perfect Exam</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                num: '1',
                title: 'Choose Your Type',
                desc: 'Select a preset exam, upload a pattern, or build a custom structure.',
              },
              {
                num: '2',
                title: 'AI Generates Exam',
                desc: 'Gemini AI creates questions matching real-world patterns and difficulty.',
              },
              {
                num: '3',
                title: 'Take & Analyze',
                desc: 'Attempt the exam with timer, get instant results and improvement insights.',
              },
            ].map((step, i) => (
              <Card key={i} className="p-8 text-center space-y-4 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              Categories
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Exams For <span className="gradient-text">Every Goal</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you are preparing for UPSC or a Google interview, we have got you covered.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((c, i) => (
              <Link href="/dashboard/generate" key={i}>
                <Card className="p-6 group hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300 h-full">
                  <div className="text-3xl mb-3">{c.emoji}</div>
                  <h3 className="font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t, j) => (
                      <Badge key={j} variant="secondary" className="text-[11px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 'AI', label: 'Powered Exam Engine' },
            { value: '6+', label: 'Exam Categories' },
            { value: '4', label: 'Assessment Types' },
            { value: '∞', label: 'Practice Sessions' },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <h3 className="text-3xl font-bold gradient-text">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="brand" className="px-3 py-1">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground">Start free. Upgrade when you are ready for unlimited power.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card
                key={i}
                className={`p-8 relative flex flex-col ${plan.popular ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-105' : ''}`}
              >
                {plan.popular && (
                  <Badge variant="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                <div className="flex items-baseline gap-1 my-6">
                  <span className="text-sm text-muted-foreground">$</span>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <div className="space-y-3 flex-1">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register" className="mt-8">
                  <Button variant={plan.popular ? 'brand' : 'outline'} className="w-full">
                    {plan.price === '0' ? 'Start Free' : 'Get Started'}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <Card className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-br from-indigo-500/10 to-sky-500/5 border-indigo-500/20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Transform</span> Your Prep?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of students and professionals using AI to ace their exams and interviews.
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
