'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl });
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authOrbs}>
                <div className={`${styles.authOrb} ${styles.authOrb1}`} />
                <div className={`${styles.authOrb} ${styles.authOrb2}`} />
            </div>

            <div className={styles.authLeft}>
                <div className={styles.authBrand}>
                    <h1>Welcome back to<br /><span className="gradient-text">ExamAI</span></h1>
                    <p>Continue your preparation journey. Your AI-powered exam partner is ready.</p>
                </div>
                <div className={styles.authFeatures}>
                    <div className={styles.authFeature}>
                        <div className={styles.authFeatureIcon}>🎯</div>
                        <div>
                            <h4>Resume Where You Left</h4>
                            <p>Pick up from your last session</p>
                        </div>
                    </div>
                    <div className={styles.authFeature}>
                        <div className={styles.authFeatureIcon}>📊</div>
                        <div>
                            <h4>Track Your Progress</h4>
                            <p>View detailed performance analytics</p>
                        </div>
                    </div>
                    <div className={styles.authFeature}>
                        <div className={styles.authFeatureIcon}>🤖</div>
                        <div>
                            <h4>AI-Powered Insights</h4>
                            <p>Get personalized improvement tips</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.authRight}>
                <div className={styles.authCard}>
                    <h2>Sign In</h2>
                    <p className={styles.subtitle}>Enter your credentials to continue</p>

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

                    <div className={styles.divider}>or continue with email</div>

                    <form onSubmit={handleSubmit}>
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
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className={styles.formRow}>
                            <label className={styles.checkLabel}>
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className={styles.forgotLink}>Forgot password?</a>
                        </div>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className={styles.authSwitch}>
                        Don&apos;t have an account? <Link href="/register">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
