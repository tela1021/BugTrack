export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
