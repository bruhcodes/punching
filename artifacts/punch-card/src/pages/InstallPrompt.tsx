import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type DeviceType = "ios" | "android" | "desktop";

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export default function InstallPrompt() {
  const [, setLocation] = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());

    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setLocation("/onboarding");
      return;
    }

    // Previously skipped
    if (localStorage.getItem("pwaPromptSkipped")) {
      setLocation("/onboarding");
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setTimeout(() => setLocation("/onboarding"), 1200);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const timer = setTimeout(() => setIsVisible(true), 300);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
    };
  }, [setLocation]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem("pwaPromptSkipped", "true");
    setLocation("/onboarding");
  };

  const iosSteps = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
      title: "Tap Share",
      desc: "Tap the share icon at the bottom of Safari",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01" />
        </svg>
      ),
      title: "Add to Home Screen",
      desc: 'Scroll down and tap "Add to Home Screen"',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      title: "Tap Add",
      desc: 'Confirm by tapping "Add" in the top right',
    },
  ];

  const androidSteps = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
        </svg>
      ),
      title: "Tap Menu",
      desc: "Tap the three-dot menu in Chrome",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: "Add to Home Screen",
      desc: 'Select "Add to Home Screen" from the menu',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      title: "Install",
      desc: 'Tap "Add" to install the app',
    },
  ];

  if (!isVisible) return null;

  const steps = device === "android" ? androidSteps : iosSteps;
  const canNativeInstall = !!deferredPrompt;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflowY: "auto",
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Logo / Icon */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
            style={{
              width: 88,
              height: 88,
              borderRadius: 28,
              background: "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 20px 60px -12px rgba(168, 85, 247, 0.4)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textAlign: "center", marginBottom: 8 }}
          >
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
              Cool Spot
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Frozen Yogurt &amp; Coffee
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: "#475569", fontSize: 15, textAlign: "center", lineHeight: 1.6, marginTop: 12, marginBottom: 32 }}
          >
            Add this to your home screen for instant access to your loyalty card, punch progress, and exclusive offers.
          </motion.p>

          {/* Native Install Button (Android Chrome) */}
          {canNativeInstall && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              onClick={handleInstall}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                border: "none",
                background: "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
                color: "white",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 12,
                boxShadow: "0 8px 32px -8px rgba(168, 85, 247, 0.4)",
                letterSpacing: "0.01em",
              }}
            >
              Install App
            </motion.button>
          )}

          {/* Step-by-step guide for iOS / fallback */}
          {(device === "ios" || !canNativeInstall) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                width: "100%",
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid #e2e8f0",
                padding: "20px",
                marginBottom: 20,
                boxShadow: "0 12px 32px -12px rgba(0,0,0,0.05)",
              }}
            >
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#38bdf8", marginBottom: 16, fontWeight: 700 }}>
                {device === "ios" ? "Add to iPhone / iPad" : device === "android" ? "Add to Android" : "How to install"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.08 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      color: "#0ea5e9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        <span style={{ color: "#94a3b8", marginRight: 6, fontSize: 12 }}>{i + 1}.</span>
                        {step.title}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0 0", lineHeight: 1.5 }}>{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Arrow pointing to browser bottom for iOS */}
              {device === "ios" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6, 1] }}
                  transition={{ delay: 0.8, duration: 2, repeat: Infinity }}
                  style={{
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "#0ea5e9",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                  </svg>
                  Look for the share icon at the bottom of Safari
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Installed confirmation */}
          {installed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#6ee7b7",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              ✓ App installed! Redirecting...
            </motion.div>
          )}

          {/* Skip */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handleSkip}
            style={{
              background: "none",
              border: "none",
              color: "#475569",
              fontSize: 14,
              cursor: "pointer",
              padding: "12px 24px",
              borderRadius: 12,
              transition: "color 0.2s",
              marginTop: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
          >
            Continue in browser instead
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
