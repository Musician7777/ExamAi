'use client';
import Link from 'next/link';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import { HiOutlineArrowRight, HiOutlinePlay, HiOutlineCheck } from 'react-icons/hi';
import { FaGraduationCap, FaUpload, FaCogs, FaCode, FaUserTie, FaChartLine } from 'react-icons/fa';
import styles from './page.module.css';

export default function Home() {
  const features = [
    { icon: <FaGraduationCap />, iconClass: styles.iconPurple, title: 'Preset Exam Generator', desc: 'Select from UPSC, SSC, Banking, Software Engineering, and more. AI generates structured exams matching real patterns.' },
    { icon: <FaUpload />, iconClass: styles.iconBlue, title: 'Upload & Learn Patterns', desc: 'Upload previous year papers. Our AI extracts structure, topics, and difficulty to generate similar exams.' },
    { icon: <FaCogs />, iconClass: styles.iconGreen, title: 'Custom Exam Builder', desc: 'Define your own structure — sections, questions, marking scheme, difficulty. AI fills in the questions.' },
    { icon: <FaCode />, iconClass: styles.iconOrange, title: 'Coding Test Module', desc: 'Integrated code editor with DSA, debugging, and system design problems. Auto-evaluated with test cases.' },
    { icon: <FaUserTie />, iconClass: styles.iconPink, title: 'AI Interview Simulator', desc: 'Practice technical, HR, and government personality interviews with dynamic AI follow-up questions.' },
    { icon: <FaChartLine />, iconClass: styles.iconYellow, title: 'Performance Analytics', desc: 'Track accuracy, speed, weak areas. Get AI-powered improvement recommendations and percentile ranking.' },
  ];

  const categories = [
    { emoji: '🏛️', title: 'Government Exams', desc: 'UPSC, SSC, Banking, Railways', tags: ['UPSC', 'SSC CGL', 'IBPS PO', 'RRB'] },
    { emoji: '💼', title: 'Private Hiring', desc: 'Tech companies & startups', tags: ['Software', 'Product', 'Startup', 'MNC'] },
    { emoji: '💻', title: 'Coding Tests', desc: 'DSA, System Design & more', tags: ['Arrays', 'Trees', 'DP', 'Design'] },
    { emoji: '🎤', title: 'Interviews', desc: 'Technical, HR & personality', tags: ['Technical', 'HR', 'Behavioral'] },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      desc: 'Get started with basics',
      price: '0',
      features: ['3 exams per month', 'Preset exam types', 'Basic analytics', 'MCQ questions only'],
      popular: false,
    },
    {
      name: 'Pro',
      desc: 'For serious aspirants',
      price: '19',
      features: ['Unlimited exams', 'All exam types', 'Coding test module', 'AI interview simulator', 'Advanced analytics', 'Upload & learn patterns', 'Priority support'],
      popular: true,
    },
    {
      name: 'Enterprise',
      desc: 'For institutes & companies',
      price: '79',
      features: ['Everything in Pro', 'Custom branding', 'Bulk user management', 'API access', 'Dedicated support', 'Custom exam blueprints', 'Hiring assessment tools'],
      popular: false,
    },
  ];

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroOrbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroBadge}>
              <span>✨</span> AI-Powered Assessment Platform
            </div>
            <h1 className={styles.heroTitle}>
              Generate Real-World<br />
              <span className="gradient-text">Exams & Interviews</span><br />
              with AI
            </h1>
            <p className={styles.heroSubtitle}>
              Create structured, realistic exams for government tests, private hiring, coding assessments, and AI-powered interview simulations — all in one platform.
            </p>
            <div className={styles.heroCta}>
              <Link href="/register" className={styles.btnPrimary}>
                Start Free <HiOutlineArrowRight />
              </Link>
              <Link href="/#features" className={styles.btnSecondary}>
                <HiOutlinePlay /> See How It Works
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <h3>📝 SSC CGL Mock Test</h3>
                <div className={styles.liveBadge}>
                  <div className={styles.liveDot} />
                  LIVE
                </div>
              </div>
              <div className={styles.miniQuestion}>
                <p><strong>Q12.</strong> If the ratio of ages of A and B is 3:5 and the sum of their ages is 48, what is the age of B?</p>
                <div className={styles.miniOptions}>
                  <div className={styles.miniOption}>A) 18</div>
                  <div className={`${styles.miniOption} ${styles.active}`}>B) 30 ✓</div>
                  <div className={styles.miniOption}>C) 24</div>
                  <div className={styles.miniOption}>D) 36</div>
                </div>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span>87%</span>
                  <small>Accuracy</small>
                </div>
                <div className={styles.heroStat}>
                  <span>42:15</span>
                  <small>Time Left</small>
                </div>
                <div className={styles.heroStat}>
                  <span>12/50</span>
                  <small>Answered</small>
                </div>
              </div>
            </div>
            <div className={styles.floatingCards}>
              <div className={`${styles.floatCard} ${styles.float1}`}>🎯 98.5 Percentile</div>
              <div className={`${styles.floatCard} ${styles.float2}`}>⚡ AI Generated</div>
              <div className={`${styles.floatCard} ${styles.float3}`}>📊 Real Patterns</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Features</span>
          <h2 className={styles.sectionTitle}>Everything You Need to<br /><span className="gradient-text">Ace Any Exam</span></h2>
          <p className={styles.sectionSubtitle}>From government competitive exams to tech interviews — one platform covers it all.</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${f.iconClass}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>How It Works</span>
          <h2 className={styles.sectionTitle}>Three Steps to<br /><span className="gradient-text">Your Perfect Exam</span></h2>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h3>Choose Your Type</h3>
            <p>Select a preset exam, upload a pattern, or build a custom structure.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h3>AI Generates Exam</h3>
            <p>Gemini AI creates questions matching real-world patterns and difficulty.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h3>Take & Analyze</h3>
            <p>Attempt the exam with timer, get instant results and improvement insights.</p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className={styles.categories}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Categories</span>
          <h2 className={styles.sectionTitle}>Exams For <span className="gradient-text">Every Goal</span></h2>
          <p className={styles.sectionSubtitle}>Whether you are preparing for UPSC or a Google interview, we have got you covered.</p>
        </div>
        <div className={styles.catGrid}>
          {categories.map((c, i) => (
            <Link href="/dashboard/generate" key={i} className={styles.catCard}>
              <div className={styles.catIcon}>{c.emoji}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <div className={styles.catTags}>
                {c.tags.map((t, j) => (
                  <span key={j} className={styles.catTag}>{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <h3>50K+</h3>
            <p>Exams Generated</p>
          </div>
          <div className={styles.statItem}>
            <h3>120K+</h3>
            <p>Users Worldwide</p>
          </div>
          <div className={styles.statItem}>
            <h3>15+</h3>
            <p>Exam Categories</p>
          </div>
          <div className={styles.statItem}>
            <h3>92%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Pricing</span>
          <h2 className={styles.sectionTitle}>Simple, <span className="gradient-text">Transparent</span> Pricing</h2>
          <p className={styles.sectionSubtitle}>Start free. Upgrade when you are ready for unlimited power.</p>
        </div>
        <div className={styles.pricingGrid}>
          {pricingPlans.map((plan, i) => (
            <div key={i} className={`${styles.priceCard} ${plan.popular ? styles.popular : ''}`}>
              {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
              <h3>{plan.name}</h3>
              <p className={styles.priceDesc}>{plan.desc}</p>
              <div className={styles.priceAmount}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{plan.price}</span>
                <span className={styles.period}>/month</span>
              </div>
              <div className={styles.priceFeatures}>
                {plan.features.map((f, j) => (
                  <div key={j} className={styles.priceFeature}>
                    <HiOutlineCheck className={styles.checkIcon} />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/register" className={`${styles.priceBtn} ${plan.popular ? styles.priceBtnFilled : styles.priceBtnOutline}`}>
                {plan.price === '0' ? 'Start Free' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaInner}>
            <h2>Ready to <span className="gradient-text">Transform</span> Your Prep?</h2>
            <p>Join thousands of students and professionals using AI to ace their exams and interviews.</p>
            <div className={styles.ctaBtns}>
              <Link href="/register" className={styles.btnPrimary}>
                Get Started Free <HiOutlineArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
