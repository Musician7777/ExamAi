'use client';
import {
  HiOutlineChatAlt2,
  HiOutlinePlay,
  HiOutlineMicrophone,
  HiOutlineVolumeUp,
  HiOutlineVolumeOff,
} from 'react-icons/hi';
import styles from '../interview.module.css';

/* ─────────────────────────────────────────────
   INTERVIEW TEMPLATES DATA
   ───────────────────────────────────────────── */
export const interviewTemplates = [
  {
    id: 'technical',
    emoji: '💻',
    title: 'Technical Interview',
    desc: 'DSA, OS, DBMS, System Design',
    interviewType: 'technical',
    role: 'Software Engineer',
    topics: ['DSA', 'OS', 'DBMS', 'Networking', 'System Design'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'hr',
    emoji: '🤝',
    title: 'HR / Behavioral',
    desc: 'Behavioral, Communication, Goals',
    interviewType: 'hr',
    role: 'General Candidate',
    topics: ['Behavioral', 'Communication', 'Salary Negotiation', 'Teamwork', 'Leadership'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Friendly',
  },
  {
    id: 'government',
    emoji: '🏛️',
    title: 'Personality Test',
    desc: 'Ethics, Current Affairs, DAF',
    interviewType: 'government',
    role: 'Civil Services Candidate',
    topics: ['Ethics', 'Current Affairs', 'DAF', 'Opinion', 'Governance'],
    difficulty: 'Hard',
    questionCount: 10,
    tone: 'Formal',
  },
  {
    id: 'frontend',
    emoji: '🎨',
    title: 'Frontend Developer',
    desc: 'React, CSS, Performance, a11y',
    interviewType: 'technical',
    role: 'Frontend Developer',
    topics: ['React', 'JavaScript', 'CSS', 'Web Performance', 'Accessibility', 'TypeScript'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'cloud',
    emoji: '☁️',
    title: 'Cloud & DevOps',
    desc: 'AWS, Docker, CI/CD, K8s',
    interviewType: 'technical',
    role: 'DevOps Engineer',
    topics: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'datascience',
    emoji: '📊',
    title: 'Data Science / ML',
    desc: 'ML, Statistics, Python, Models',
    interviewType: 'technical',
    role: 'Data Scientist',
    topics: ['Machine Learning', 'Statistics', 'Python', 'Deep Learning', 'NLP', 'Data Analysis'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'consulting',
    emoji: '🏢',
    title: 'Management Consulting',
    desc: 'Case Studies, Frameworks, Strategy',
    interviewType: 'hr',
    role: 'Management Consultant',
    topics: ['Case Studies', 'Market Sizing', 'Business Strategy', 'Problem Solving', 'Communication'],
    difficulty: 'Hard',
    questionCount: 10,
    tone: 'Challenging',
  },
  {
    id: 'campus',
    emoji: '🎓',
    title: 'Campus Placement',
    desc: 'Aptitude, CS Basics, HR',
    interviewType: 'technical',
    role: 'Fresh Graduate',
    topics: ['OOP', 'Basic DSA', 'DBMS Basics', 'OS Basics', 'HR Questions'],
    difficulty: 'Easy',
    questionCount: 10,
    tone: 'Friendly',
  },
];

export const customTopicOptions = [
  'DSA',
  'System Design',
  'OOP',
  'DBMS',
  'OS',
  'Networking',
  'React',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'AWS',
  'Docker',
  'Kubernetes',
  'CI/CD',
  'Git',
  'Machine Learning',
  'Deep Learning',
  'Statistics',
  'NLP',
  'Behavioral',
  'Leadership',
  'Teamwork',
  'Communication',
  'SQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST API',
  'Web Security',
  'Performance',
  'Testing',
  'Agile',
];

/* ─────────────────────────────────────────────
   CUSTOM BUILDER COMPONENT
   ───────────────────────────────────────────── */
function CustomBuilder({ customConfig, setCustomConfig, showCustom }) {
  function toggleCustomTopic(topic) {
    setCustomConfig((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic) ? prev.topics.filter((t) => t !== topic) : [...prev.topics, topic],
    }));
  }

  if (!showCustom) return null;

  return (
    <div className={styles.customBuilder}>
      <h2>✨ Build Your Interview</h2>
      <div className={styles.builderGrid}>
        <div className={styles.fieldGroup}>
          <label>Role / Position *</label>
          <input
            type="text"
            placeholder="e.g. Senior React Developer"
            value={customConfig.role}
            onChange={(e) => setCustomConfig((p) => ({ ...p, role: e.target.value }))}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Company (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Google, Amazon"
            value={customConfig.company}
            onChange={(e) => setCustomConfig((p) => ({ ...p, company: e.target.value }))}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Difficulty</label>
          <select
            value={customConfig.difficulty}
            onChange={(e) => setCustomConfig((p) => ({ ...p, difficulty: e.target.value }))}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Questions</label>
          <select
            value={customConfig.questionCount}
            onChange={(e) => setCustomConfig((p) => ({ ...p, questionCount: parseInt(e.target.value) }))}
          >
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Tone</label>
          <select value={customConfig.tone} onChange={(e) => setCustomConfig((p) => ({ ...p, tone: e.target.value }))}>
            <option value="Friendly">Friendly</option>
            <option value="Professional">Professional</option>
            <option value="Challenging">Challenging</option>
            <option value="Formal">Formal</option>
          </select>
        </div>
        <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
          <label>Topics ({customConfig.topics.length} selected)</label>
          <div className={styles.topicChips}>
            {customTopicOptions.map((topic) => (
              <button
                key={topic}
                className={`${styles.topicChip} ${customConfig.topics.includes(topic) ? styles.active : ''}`}
                onClick={() => toggleCustomTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TEMPLATE GRID COMPONENT
   ───────────────────────────────────────────── */
function TemplateGrid({ selectedTemplate, showCustom, setSelectedTemplate, setShowCustom }) {
  return (
    <div className={styles.templateGrid}>
      {interviewTemplates.map((t) => (
        <div
          key={t.id}
          className={`${styles.templateCard} ${selectedTemplate === t.id && !showCustom ? styles.selected : ''}`}
          onClick={() => {
            setSelectedTemplate(t.id);
            setShowCustom(false);
          }}
        >
          <div className={styles.templateEmoji}>{t.emoji}</div>
          <h3>{t.title}</h3>
          <p>{t.desc}</p>
          <div className={styles.templateTopics}>
            {t.topics.slice(0, 4).map((topic, i) => (
              <span key={i} className={styles.templateTopic}>
                {topic}
              </span>
            ))}
            {t.topics.length > 4 && <span className={styles.templateTopic}>+{t.topics.length - 4}</span>}
          </div>
        </div>
      ))}
      <div
        className={`${styles.templateCard} ${styles.customCard} ${showCustom ? styles.selected : ''}`}
        onClick={() => {
          setShowCustom(true);
          setSelectedTemplate(null);
        }}
      >
        <div className={styles.templateEmoji}>✨</div>
        <h3>Custom Interview</h3>
        <p>Design your own interview</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VOICE CONTROLS COMPONENT
   ───────────────────────────────────────────── */
function VoiceControls({ voiceEnabled, setVoiceEnabled, micEnabled, setMicEnabled, sttSupported }) {
  return (
    <div className={styles.voiceToggles}>
      <button
        className={`${styles.voiceToggle} ${voiceEnabled ? styles.active : ''}`}
        onClick={() => setVoiceEnabled((v) => !v)}
      >
        {voiceEnabled ? <HiOutlineVolumeUp /> : <HiOutlineVolumeOff />}
        Speaker {voiceEnabled ? 'On' : 'Off'}
      </button>
      {sttSupported && (
        <button
          className={`${styles.voiceToggle} ${micEnabled ? styles.active : ''}`}
          onClick={() => setMicEnabled((v) => !v)}
        >
          <HiOutlineMicrophone />
          Mic {micEnabled ? 'On' : 'Off'}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN INTERVIEW SETUP COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewSetup({
  selectedTemplate,
  setSelectedTemplate,
  showCustom,
  setShowCustom,
  customConfig,
  setCustomConfig,
  voiceEnabled,
  setVoiceEnabled,
  micEnabled,
  setMicEnabled,
  sttSupported,
  onStart,
}) {
  function canStart() {
    if (showCustom) return customConfig.role.trim().length > 0;
    return selectedTemplate !== null;
  }

  return (
    <div className={styles.setupPage}>
      <h1>
        <HiOutlineChatAlt2 style={{ display: 'inline', verticalAlign: 'middle' }} /> AI Interview{' '}
        <span className="gradient-text">Simulator</span>
      </h1>
      <p>Practice realistic interviews with AI. Get real-time voice feedback on your answers.</p>

      <TemplateGrid
        selectedTemplate={selectedTemplate}
        showCustom={showCustom}
        setSelectedTemplate={setSelectedTemplate}
        setShowCustom={setShowCustom}
      />

      <CustomBuilder customConfig={customConfig} setCustomConfig={setCustomConfig} showCustom={showCustom} />

      <div className={styles.startControls}>
        <VoiceControls
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          micEnabled={micEnabled}
          setMicEnabled={setMicEnabled}
          sttSupported={sttSupported}
        />
        <button className={styles.startBtn} disabled={!canStart()} onClick={onStart}>
          <HiOutlinePlay /> Start Interview
        </button>
      </div>
    </div>
  );
}
