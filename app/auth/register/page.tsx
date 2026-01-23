export default function RegisterForbidden() {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <div style={{ textAlign: "center" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Closed System</h1>
                <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
                    Registration is restricted to authorized users only.
                </p>
            </div>
        </div>
    );
}
