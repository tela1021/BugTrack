import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div style={{ padding: '40px' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>BZ Admin Console</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>System-wide settings and organization management</p>
            </header>
            {children}
        </div>
    );
}
