'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  ArrowRight,
  GraduationCap,
  Code,
  MessageSquare,
  Upload,
  BarChart3,
  Lightbulb,
  Target,
  Clock,
  Star,
} from 'lucide-react';

const articles = [
  {
    category: 'Exam Preparation',
    icon: GraduationCap,
    title: 'How AI Is Transforming Competitive Exam Preparation in 2025',
    excerpt:
      'The landscape of exam preparation is undergoing a fundamental shift. Traditional coaching centers and static question banks are being supplemented — and in some cases replaced — by AI-powered platforms that can generate unlimited, personalized practice material. Here is how artificial intelligence is making competitive exam preparation more accessible, adaptive, and effective than ever before.',
    content: `Competitive exams like UPSC, SSC CGL, IBPS PO, and campus placement tests have always been high-stakes affairs. With millions of applicants competing for limited positions, the quality and quantity of practice material can make or break a candidate's preparation.

Historically, students relied on coaching institutes (often costing ₹50,000–₹2,00,000 per year), static question banks that rarely updated, and previous year papers. While effective, these resources have significant limitations:

• **Cost:** Premium coaching is unaffordable for many aspirants.
• **Geographic access:** Top coaching centers are concentrated in a few cities.
• **Staleness:** Question banks don't adapt to evolving exam patterns.
• **One-size-fits-all:** Every student gets the same material regardless of their strengths and weaknesses.

AI-powered platforms like ExamAI address all four of these limitations. By leveraging large language models, we can generate fresh, pattern-accurate exam papers on demand. Our AI analyzes the structure of real examinations — sections, question types, difficulty distribution, marking schemes — and creates new questions that faithfully replicate these patterns while ensuring the content is original.

The result? A student in a small town in Rajasthan gets access to the same quality of practice material as someone attending a ₹2 lakh coaching program in Delhi. And because the questions are generated dynamically, no two practice sessions are ever the same.`,
    date: 'May 25, 2025',
    readTime: '6 min read',
  },
  {
    category: 'Coding Tests',
    icon: Code,
    title: 'Mastering Data Structures and Algorithms: A Strategic Approach for Tech Interviews',
    excerpt:
      'Cracking coding interviews at top tech companies requires more than just knowing algorithms — it demands a strategic approach to practice. Learn how to build a systematic DSA preparation plan using AI-generated coding challenges that adapt to your skill level.',
    content: `Data Structures and Algorithms (DSA) remain the cornerstone of technical interviews at major tech companies. Whether you are targeting FAANG, high-growth startups, or established MNCs, your ability to solve algorithmic problems efficiently under time pressure is the primary evaluation criterion.

The most effective DSA preparation strategy involves three phases:

**Phase 1: Foundation Building (Weeks 1-4)**
Start with fundamental data structures — arrays, linked lists, stacks, queues, hash maps, and trees. For each data structure, understand its operations, time complexities, and common use cases. Practice 3-5 easy problems daily using ExamAI's coding module, which generates problems calibrated to beginner difficulty.

**Phase 2: Pattern Recognition (Weeks 5-8)**
Graduate to medium-difficulty problems and focus on recognizing problem patterns: two pointers, sliding window, binary search variations, BFS/DFS, dynamic programming (1D and 2D), and greedy algorithms. ExamAI's adaptive difficulty system helps you progress naturally — it increases problem difficulty as your accuracy improves.

**Phase 3: Competition Simulation (Weeks 9-12)**
Attempt hard problems and simulate real interview conditions. Set a timer (45 minutes per problem), explain your approach aloud, and analyze edge cases before coding. ExamAI's timed coding tests with automated evaluation replicate the pressure of real technical interviews.

The key insight is consistency over intensity. Solving 2-3 problems daily for 12 weeks is far more effective than cramming 50 problems the week before an interview.`,
    date: 'May 20, 2025',
    readTime: '8 min read',
  },
  {
    category: 'Interview Tips',
    icon: MessageSquare,
    title: 'The Complete Guide to AI-Powered Interview Preparation',
    excerpt:
      'Modern interview preparation goes beyond memorizing answers. Discover how AI interview simulators help you develop the adaptive thinking and communication skills that real interviewers look for — with dynamic follow-up questions that train you for unexpected scenarios.',
    content: `Interviews are conversations, not recitations. Yet most interview preparation resources treat them as the latter — providing canned questions with scripted "model answers" that fall apart the moment an interviewer asks an unexpected follow-up.

This is where AI interview simulation fundamentally changes the preparation paradigm. Instead of practicing with a static list of questions, ExamAI's interview simulator engages you in a dynamic conversation where follow-up questions are generated based on your actual responses.

**Why Dynamic Follow-ups Matter:**

In a real technical interview, if you mention using a hash map to solve a problem, the interviewer might ask: "What happens when you have hash collisions?" or "Can you solve this with O(1) space instead?" A static question bank cannot simulate this — but an AI interviewer can.

Similarly, in HR interviews, if you describe a team conflict you resolved, a good interviewer will probe deeper: "What would you do differently next time?" or "How did you ensure the other person felt heard?" These follow-up questions test genuine reflection and cannot be memorized.

**Types of Interviews ExamAI Simulates:**

1. **Technical Interviews:** Covers system design, problem-solving approaches, technology-specific questions, and live coding walkthroughs.
2. **HR / Behavioral:** Situation-based questions using the STAR method, cultural fit assessment, and motivation exploration.
3. **Government Personality Tests:** Structured personality assessments for UPSC, state PSC, and defense service interviews, covering current affairs, ethics, and administrative scenarios.

The AI evaluates your responses on clarity, depth, relevance, and communication style — providing actionable feedback after each session.`,
    date: 'May 15, 2025',
    readTime: '7 min read',
  },
  {
    category: 'Study Tips',
    icon: Target,
    title: 'How to Use Pattern Analysis to Predict Exam Questions',
    excerpt:
      'Every competitive exam follows patterns. Learn how to analyze previous year papers to identify recurring topics, question types, and difficulty distributions — and how ExamAI automates this analysis to generate targeted practice papers.',
    content: `Successful exam preparation is not just about studying hard — it is about studying smart. And the smartest approach starts with understanding the exam itself.

Every major competitive exam follows predictable patterns:

• **UPSC Prelims:** Approximately 30-35% questions from current affairs, 20% from history, 15% from geography, 10% from economy, and the rest from science, environment, and polity.
• **SSC CGL Tier I:** Fixed distribution across quantitative aptitude, English, general awareness, and reasoning — with difficulty levels that follow recognizable trends year over year.
• **Tech Placement Tests:** Major companies like TCS, Infosys, and Wipro follow template-based patterns for their aptitude rounds, with predictable question types and difficulty curves.

**How Pattern Analysis Works:**

When you upload a previous year paper to ExamAI, our AI performs multi-dimensional pattern analysis:

1. **Section structure:** How many sections, what time allocation, and what marking scheme.
2. **Topic distribution:** Which topics appear most frequently and with what weight.
3. **Difficulty curve:** How difficulty is distributed across the paper — does it start easy and get harder, or is it randomly distributed?
4. **Question type mix:** The ratio of MCQ, MSQ (multiple select), numerical answer type, and descriptive questions.

The AI then generates new questions that match these patterns precisely — giving you practice papers that feel exactly like the real thing. Over time, this trains your brain to recognize question patterns, manage time effectively, and build topic-specific confidence.`,
    date: 'May 10, 2025',
    readTime: '6 min read',
  },
  {
    category: 'Platform Guide',
    icon: Upload,
    title: 'Getting Started with ExamAI: A Step-by-Step Guide for New Users',
    excerpt:
      'New to ExamAI? This comprehensive guide walks you through account setup, generating your first exam, using the coding module, trying the interview simulator, and understanding your analytics dashboard.',
    content: `Welcome to ExamAI! This guide will help you make the most of the platform from day one.

**Step 1: Create Your Account**
Sign up using your email address or Google account. Email registrations require verification — check your inbox for a confirmation link. Google sign-in gets you started immediately.

**Step 2: Generate Your First Exam**
Navigate to the "Generate Exam" section from your dashboard sidebar. You have three options:
- **Preset Exams:** Choose from pre-configured exam types like UPSC, SSC, Banking, and more.
- **Upload & Learn:** Upload a PDF of a previous year paper and let AI analyze the pattern.
- **Custom Builder:** Define your own sections, question types, and difficulty levels.

Select your preferred method, configure the settings, and click "Generate." The AI typically creates a complete exam within 15-30 seconds.

**Step 3: Take the Exam**
The exam interface features a timer, question navigator, and answer tracking. You can flag questions for review, navigate between sections, and submit when ready. Your progress is auto-saved — if you lose connection, you can resume where you left off.

**Step 4: Review Your Results**
After submission, you will receive a detailed breakdown: overall score, section-wise performance, time analysis per question, correct/incorrect breakdown, and AI-generated explanations for each question.

**Step 5: Explore Other Modules**
Try the Coding Test module for DSA practice, the Interview Simulator for mock interviews, and the Analytics dashboard to track your improvement over time. The Leaderboard lets you see how you rank among other ExamAI users.

**Pro Tip:** Consistency matters more than volume. Taking one exam daily with thorough result analysis is more effective than taking five exams without reviewing your mistakes.`,
    date: 'May 5, 2025',
    readTime: '5 min read',
  },
  {
    category: 'Analytics',
    icon: BarChart3,
    title: 'Understanding Your ExamAI Analytics: Turning Data into Better Scores',
    excerpt:
      'Your ExamAI analytics dashboard is more than just a score tracker. Learn how to interpret accuracy trends, time management patterns, and topic-wise performance data to build a targeted study plan that improves your weakest areas.',
    content: `Most students focus on taking more tests. The highest-performing students focus on analyzing their results. ExamAI's analytics dashboard is designed to help you do exactly that.

**Key Metrics to Watch:**

1. **Overall Accuracy Trend:** This shows your accuracy percentage over your last 10-20 exams. A steady upward trend indicates effective learning. Plateaus suggest you need to change your study strategy — perhaps tackling harder questions or focusing on specific weak topics.

2. **Topic-wise Performance:** This heat map shows which topics you consistently score well in and which ones drag your average down. Redirect your study time toward low-performing topics rather than reinforcing areas you already know well.

3. **Time per Question:** This reveals time management patterns. If you spend 3 minutes on questions that should take 1 minute, you are likely second-guessing yourself. If you rush through questions in 20 seconds and get them wrong, you are being careless. The ideal is finding a consistent pace that matches the exam's time constraints.

4. **Difficulty Distribution:** How do you perform across easy, medium, and hard questions? Most students score well on easy questions but lose marks on medium ones due to careless errors. Hard questions account for fewer total marks, so mastering medium-difficulty questions often yields the highest score improvement.

5. **Streak and XP:** Gamification metrics like your study streak and XP points help maintain motivation. Research shows that maintaining a daily practice streak — even if short — is more effective for long-term retention than irregular intensive sessions.

**Action Plan:**
After each exam, spend 15 minutes reviewing: (a) questions you got wrong, (b) questions you guessed correctly, and (c) questions that took too long. This review habit, combined with ExamAI's analytics, creates a powerful feedback loop for continuous improvement.`,
    date: 'May 1, 2025',
    readTime: '7 min read',
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full bg-sky-500/8 blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <Badge variant="brand" className="px-4 py-1.5 text-sm gap-1.5 mb-6">
            <span>📝</span> ExamAI Blog
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Insights, Tips \u0026 <span className="gradient-text">Study Strategies</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Expert advice on exam preparation, coding interview strategies, AI-powered learning, and making the most of
            your practice sessions. Written by the ExamAI team.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-indigo-500/5 to-sky-500/5 border-indigo-500/10 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="brand" className="px-3 py-1 text-xs">
                Featured
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-xs">
                {articles[0].category}
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{articles[0].title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{articles[0].excerpt}</p>
            <div className="flex flex-col gap-6">
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {articles[0].content}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {articles[0].readTime}
                </span>
                <span>{articles[0].date}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* All Articles */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl font-bold">
              Latest <span className="gradient-text">Articles</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Practical advice and in-depth guides to help you prepare smarter, not harder.
            </p>
          </div>

          <div className="space-y-8">
            {articles.slice(1).map((article, i) => {
              const Icon = article.icon;
              return (
                <Card key={i} className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                    </div>
                    <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {article.readTime}
                      </span>
                      <span>{article.date}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{article.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{article.excerpt}</p>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border pt-4">
                    {article.content}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold">
            Start Your <span className="gradient-text">Preparation Journey</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Put these strategies into practice with ExamAI. Generate unlimited AI-powered exams, practice coding
            challenges, and simulate interviews — all for free.
          </p>
          <Link href="/register">
            <Button variant="brand" size="xl" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
