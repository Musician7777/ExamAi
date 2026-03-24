'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';
import styles from '../auth.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Register the user
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                setLoading(false);
                return;
            }

            // Auto-login after successful registration
            const result = await signIn('credentials', {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Account created! But auto-login failed. Please sign in manually.');
                router.push('/login');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/dashboard' });
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authOrbs}>
                <div className={`${styles.authOrb} ${styles.authOrb1}`} />
                <div className={`${styles.authOrb} ${styles.authOrb2}`} />
            </div>

            <div className={styles.authLeft}>
                <div className={styles.authBrand}>
                    <h1>Join <span className="gradient-text">ExamAI</span><br />Today</h1>
                    <p>Start your journey with AI-powered exam preparation. Free forever for basic features.</p>
                </div>
                <div className={styles.authFeatures}>
                    <div className={styles.authFeature}>
                        <div className={styles.authFeatureIcon}>🚀</div>
                        <div>
                            <h4>Get Started Instantly</h4>
                            <p>Generate your first exam in seconds</p>
                        </div>
                    </div>
                    <div className={styles.authFeature}>
                        <div className={styles.authFeatureIcon}>🎓</div>
                        <div>
                            <h4>15+ Exam Categories</h4>
                            <p>Government, private, coding & more</p>
                        </div>
                    </div>
                    <div className={styles.authFeature}>
                        <div className={styles.authFeatureIcon}>💡</div>
                        <div>
                            <h4>Powered by Gemini AI</h4>
                            <p>State-of-the-art AI question generation</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.authRight}>
                <div className={styles.authCard}>
                    <h2>Create Account</h2>
                    <p className={styles.subtitle}>Start your free account today</p>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <div className={styles.socialBtns}>
                        <button
                            className={styles.socialBtn}
                            onClick={handleGoogleSignIn}
                            type="button"
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <FaGoogle /> Continue with Google
                        </button>
                    </div>

                    <div className={styles.divider}>or register with email</div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="John Doe"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                className={styles.formInput}
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Password</label>
                            <input
                                type="password"
                                className={styles.formInput}
                                placeholder="Min 8 characters"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                minLength={8}
                                disabled={loading}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                className={styles.formInput}
                                placeholder="Re-enter password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className={styles.authSwitch}>
                        Already have an account? <Link href="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
