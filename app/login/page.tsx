'use client';

import { useState } from 'react';
import styles from './Login.module.css';
import { Terminal, Github, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call Auth.js or Supabase Auth
        console.log('Logging in with:', email);
        window.location.href = '/';
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.logoSection}>
                    <div className={styles.logo}>
                        <Terminal size={32} />
                    </div>
                    <h1 className={styles.title}>BugZero</h1>
                    <p className={styles.subtitle}>Engineering-first issue tracking</p>
                </div>

                <div className={styles.loginBox}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <Mail size={18} className={styles.inputIcon} />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <div className={styles.inputWrapper}>
                                <ShieldCheck size={18} className={styles.inputIcon} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            Sign In <ArrowRight size={18} />
                        </button>
                    </form>
                    {/* Social login removed per user request */}
                </div>

                <p className={styles.footer}>
                    Don't have an account? <Link href="/login">Contact Administrator</Link>
                </p>
            </div>
        </div>
    );
}
