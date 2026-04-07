import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [, setLocation] = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setLocation("/card");
      return;
    }

    // Check if skipped previously
    if (localStorage.getItem("pwaPromptSkipped")) {
      setLocation("/card");
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Also show standard view if prompt doesn't fire immediately
    const timer = setTimeout(() => {
      if (!isVisible) setIsVisible(true);
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [setLocation, isVisible]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Show iOS install instructions if no prompt available
      alert("Tap the Share icon at the bottom of your screen and select 'Add to Home Screen'");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("pwaPromptSkipped", "true");
    setLocation("/card");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-[400px] flex flex-col items-center text-center space-y-8"
        >
          <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Add to Home Screen</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Install the Punch Card app for quick access, offline support, and a better experience.
            </p>
          </div>

          <div className="w-full space-y-3 pt-8">
            <Button size="lg" className="w-full text-lg h-14 rounded-2xl" onClick={handleInstall}>
              Install App
            </Button>
            <Button variant="ghost" size="lg" className="w-full text-lg h-14 rounded-2xl text-muted-foreground" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
