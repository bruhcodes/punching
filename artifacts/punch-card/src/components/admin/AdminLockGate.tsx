import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";

const ADMIN_PASSWORD = "12345";
const ADMIN_SESSION_KEY = "admin-unlocked";

export function AdminLockGate({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(ADMIN_SESSION_KEY) === "true");
  }, []);

  if (unlocked) {
    return <>{children}</>;
  }

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setError("Incorrect password. Please try again.");
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setUnlocked(true);
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 100,
              height: 100,
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo.png" alt="Cool Spot Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.03em",
              fontFamily: "var(--app-font-serif, serif)",
            }}
          >
            Admin Access
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: "5px 0 0",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Cool Spot Frozen Yogurt &amp; Coffee
          </p>
          <p style={{ fontSize: 13, color: "#64748b", margin: "10px 0 0", lineHeight: 1.5 }}>
            Staff use only. Enter your admin password to continue.
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            padding: "28px 24px",
            boxShadow: "0 12px 32px -12px rgba(0,0,0,0.05)",
          }}
        >
          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="admin-password"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: 8,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter admin password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: error
                    ? "1.5px solid rgba(239, 68, 68, 0.5)"
                    : "1.5px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                  letterSpacing: "0.1em",
                }}
                onFocus={(e) =>
                  !error && (e.currentTarget.style.borderColor = "#38bdf8")
                }
                onBlur={(e) =>
                  !error && (e.currentTarget.style.borderColor = "#e2e8f0")
                }
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#ef4444",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
                color: "white",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 8px 24px -8px rgba(168, 85, 247, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <LockKeyhole style={{ width: 16, height: 16 }} />
              Unlock Dashboard
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 24,
          }}
        >
          Authorized personnel only · Cool Spot Staff Portal
        </p>
      </div>
    </div>
  );
}
