"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Registration logic
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            router.push("/auth/login?registered=true");
        } catch (err: any) {
            setError(err.message);
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
                        <UserPlus size={24} />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>Create an account</h1>
                    <p style={{ color: "var(--muted-foreground)", fontSize: "14px", marginTop: "4px" }}>
                        Start managing your projects with BugZero
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                        <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--muted-foreground)" }} />
                        <input
                            type="text"
                            placeholder="Full name"
                            className="input"
                            style={{ width: "100%", paddingLeft: "40px", height: "42px" }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Get Started"}
                    </button>
                </form>

                <p style={{ textAlign: "center", fontSize: "14px", color: "var(--muted-foreground)" }}>
                    Already have an account? <Link href="/auth/login" style={{ color: "var(--foreground)", fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
