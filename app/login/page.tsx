"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Terminal } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "var(--background)"
        }}>
            <div className="glass" style={{
                width: "100%",
                maxWidth: "400px",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                boxShadow: "var(--shadow-lg)"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        display: "inline-flex",
                        padding: "12px",
                        borderRadius: "12px",
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        marginBottom: "16px"
                    }}>
                        <Terminal size={24} />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>BugZero</h1>
                    <p style={{ color: "var(--muted-foreground)", fontSize: "14px", marginTop: "4px" }}>
                        Sign in to manage your workspace
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                        <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--muted-foreground)" }} />
                        <input
                            type="email"
                            placeholder="Email address"
                            className="input"
                            style={{ width: "100%", paddingLeft: "40px", height: "42px" }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ position: "relative" }}>
                        <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--muted-foreground)" }} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input"
                            style={{ width: "100%", paddingLeft: "40px", height: "42px" }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: "10px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 500,
                            border: "1px solid #fee2e2"
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ height: "42px", fontWeight: 600 }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
