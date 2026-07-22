"use client";

import { useActionState } from "react";
import { updatePassword, type PasswordActionState } from "@/actions/settings";
import styles from "./Settings.module.css";
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import ThemePreference from '@/components/ThemePreference';

const initialState: PasswordActionState = { fieldErrors: {} };

export default function SettingsPage() {
    const [state, formAction, isPending] = useActionState(updatePassword, initialState);

    return (
        <div style={{ padding: '40px', maxWidth: '800px' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Settings</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>Manage your account settings and security</p>
            </header>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.iconBox}>
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h2 className={styles.sectionTitle}>Security</h2>
                        <p className={styles.sectionSubtext}>Update your password to keep your account secure</p>
                    </div>
                </div>

                <form action={formAction} className={styles.form}>
                    {state?.error && (
                        <div className={styles.errorBanner}>
                            <AlertCircle size={16} />
                            <span>{state.error}</span>
                        </div>
                    )}

                    {state?.success && (
                        <div className={styles.successBanner}>
                            <ShieldCheck size={16} />
                            <span>{state.success}</span>
                        </div>
                    )}

                    <div className={styles.formField}>
                        <label htmlFor="currentPassword">Current Password</label>
                        <div className={styles.inputWrapper}>
                            <KeyRound className={styles.inputIcon} size={16} />
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        {state?.fieldErrors?.currentPassword && (
                            <p className={styles.fieldError}>{state.fieldErrors.currentPassword[0]}</p>
                        )}
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="newPassword">New Password</label>
                        <div className={styles.inputWrapper}>
                            <KeyRound className={styles.inputIcon} size={16} />
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                placeholder="Min. 12 characters"
                                required
                            />
                        </div>
                        {state?.fieldErrors?.newPassword && (
                            <p className={styles.fieldError}>{state.fieldErrors.newPassword[0]}</p>
                        )}
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className={styles.inputWrapper}>
                            <KeyRound className={styles.inputIcon} size={16} />
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>
                        {state?.fieldErrors?.confirmPassword && (
                            <p className={styles.fieldError}>{state.fieldErrors.confirmPassword[0]}</p>
                        )}
                    </div>

                    <div className={styles.formFooter}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isPending}
                        >
                            {isPending ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
            <div className={styles.section} style={{ marginTop: '24px' }}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Внешний вид</h2>
                        <p className={styles.sectionSubtext}>Выберите тему интерфейса. Системная тема следует настройкам устройства.</p>
                    </div>
                </div>
                <ThemePreference />
            </div>
        </div>
    );
}
