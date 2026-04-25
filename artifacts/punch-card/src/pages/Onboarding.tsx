import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateUser, useHealthCheck, getHealthCheckQueryKey, listUsers } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const createUser = useCreateUser();

  const { isLoading: isCheckingServer, isError: isServerOffline } =
    useHealthCheck({
      query: {
        queryKey: getHealthCheckQueryKey(),
        retry: false,
        staleTime: 0,
      },
    });

  useEffect(() => {
    const existingId = localStorage.getItem("punchCardUserId");
    if (existingId) {
      setLocation("/card");
    }
  }, [setLocation]);

  const clearError = () => {
    if (formError) setFormError("");
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setFormError("Please fill in your name and phone number.");
      return;
    }
    if (isServerOffline) {
      setFormError("App server is offline right now.");
      return;
    }
    setFormError("");

    createUser.mutate(
      { data: { name: name.trim(), phone: phone.trim() } },
      {
        onSuccess: (user) => {
          localStorage.setItem("punchCardUserId", user.id);
          toast({
            title: "Welcome to Cool Spot!",
            description: "Your loyalty card is ready.",
          });
          setLocation("/card");
        },
        onError: (error) => {
          let message = "We couldn't create your card yet.";
          const apiError = error as { status?: number; data?: unknown };
          if (typeof apiError.status === "number") {
            if (apiError.status === 409) {
              message = "That phone number already has a card. Try signing in instead.";
            } else if (apiError.status >= 500) {
              message = "The server is on, but the database isn't ready yet.";
            } else if (
              typeof apiError.data === "object" &&
              apiError.data &&
              "error" in apiError.data
            ) {
              const m = (apiError.data as { error?: string }).error;
              if (m) message = m;
            }
          }
          setFormError(message);
        },
      }
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setFormError("Please enter your phone number.");
      return;
    }
    if (isServerOffline) {
      setFormError("App server is offline right now.");
      return;
    }
    setFormError("");
    setLookingUp(true);

    try {
      const users = await listUsers({ search: phone.trim() });
      // Exact match on digits-only comparison for accuracy
      const normalized = phone.replace(/\D/g, "");
      const match = Array.isArray(users)
        ? users.find(
            (u: { phone: string }) =>
              u.phone.replace(/\D/g, "") === normalized
          )
        : null;

      if (!match) {
        setFormError(
          "No card found for that number. Sign up to create one!"
        );
        setLookingUp(false);
        return;
      }

      localStorage.setItem("punchCardUserId", match.id);
      toast({
        title: "Welcome back!",
        description: "Here's your Cool Spot loyalty card.",
      });
      setLocation("/card");
    } catch (err) {
      const msg = err instanceof TypeError
        ? "Can't reach the server — make sure the app is running with `pnpm dev`."
        : "Something went wrong. Please try again.";
      setFormError(msg);
    } finally {
      setLookingUp(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: 16,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 8,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 400 }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            style={{
              width: 140,
              height: 140,
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo.png" alt="Cool Spot Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </motion.div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.03em",
              fontFamily: "var(--app-font-serif, serif)",
            }}
          >
            Cool Spot
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: "5px 0 0",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Frozen Yogurt &amp; Coffee
          </p>
          <p style={{ fontSize: 14, color: "#475569", margin: "12px 0 0", lineHeight: 1.6 }}>
            Your loyalty rewards, always in your pocket.
          </p>
        </div>

        {/* Card container */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 12px 32px -12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", padding: "12px 12px 0" }}>
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setFormError("");
                  setName("");
                  setPhone("");
                }}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 12,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background:
                    tab === t
                      ? "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)"
                      : "transparent",
                  color: tab === t ? "#ffffff" : "#64748b",
                  boxShadow:
                    tab === t
                      ? "0 4px 16px -4px rgba(168, 85, 247, 0.4)"
                      : "none",
                  letterSpacing: "0.02em",
                }}
              >
                {t === "login" ? "Sign In" : "Create Card"}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "login" ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "login" ? 16 : -16 }}
              transition={{ duration: 0.22 }}
              style={{ padding: "24px" }}
            >
              {tab === "login" ? (
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError();
                      }}
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#38bdf8")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#e2e8f0")
                      }
                    />
                    <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 0" }}>
                      Enter the number you used when signing up
                    </p>
                  </div>

                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#ef4444",
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {formError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={lookingUp || isCheckingServer}
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: 14,
                      border: "none",
                      background:
                        lookingUp || isCheckingServer
                          ? "#f1f5f9"
                          : "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
                      color: lookingUp || isCheckingServer ? "#94a3b8" : "white",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: lookingUp || isCheckingServer ? "not-allowed" : "pointer",
                      boxShadow:
                        lookingUp || isCheckingServer
                          ? "none"
                          : "0 8px 24px -8px rgba(168, 85, 247, 0.4)",
                      transition: "all 0.2s",
                    }}
                  >
                    {lookingUp ? "Looking up your card..." : "Sign In"}
                  </button>

                  <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: "16px 0 0" }}>
                    First time here?{" "}
                    <button
                      type="button"
                      onClick={() => { setTab("signup"); setFormError(""); }}
                      style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                    >
                      Create your card
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignUp}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => { setName(e.target.value); clearError(); }}
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#38bdf8")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#e2e8f0")
                      }
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); clearError(); }}
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#38bdf8")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#e2e8f0")
                      }
                    />
                    <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 0" }}>
                      We use this to find your card when you come back
                    </p>
                  </div>

                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#ef4444",
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {formError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={createUser.isPending || isCheckingServer}
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: 14,
                      border: "none",
                      background:
                        createUser.isPending || isCheckingServer
                          ? "#f1f5f9"
                          : "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
                      color: createUser.isPending || isCheckingServer ? "#94a3b8" : "white",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: createUser.isPending || isCheckingServer ? "not-allowed" : "pointer",
                      boxShadow:
                        createUser.isPending || isCheckingServer
                          ? "none"
                          : "0 8px 24px -8px rgba(168, 85, 247, 0.4)",
                      transition: "all 0.2s",
                    }}
                  >
                    {createUser.isPending ? "Creating card..." : "Get My Loyalty Card"}
                  </button>

                  <p style={{ textAlign: "center", fontSize: 13, color: "#475569", margin: "16px 0 0" }}>
                    Already a member?{" "}
                    <button
                      type="button"
                      onClick={() => { setTab("login"); setFormError(""); }}
                      style={{ background: "none", border: "none", color: "#06b6d4", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                    >
                      Sign in instead
                    </button>
                  </p>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 24, lineHeight: 1.6 }}
        >
          Earn 1 punch per visit · 10 punches = 1 free drink
        </motion.p>
      </motion.div>
    </div>
  );
}
