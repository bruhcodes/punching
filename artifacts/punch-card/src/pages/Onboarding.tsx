import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getHealthCheckQueryKey, useCreateUser, useHealthCheck } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const isHostedBackend = Boolean(apiBaseUrl);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  const createUser = useCreateUser();
  const { isLoading: isCheckingServer, isError: isServerOffline } = useHealthCheck({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setFormError("Please enter your name and phone number.");
      return;
    }

    if (isServerOffline) {
      setFormError(isHostedBackend ? "The app server is offline right now." : "The app server is not running yet. Start localhost first.");
      return;
    }

    setFormError("");

    createUser.mutate(
      { data: { name, phone } },
      {
        onSuccess: (user) => {
          localStorage.setItem("punchCardUserId", user.id);
          toast({
            title: "Card created",
            description: "Your digital card is ready.",
          });
          setLocation("/card");
        },
        onError: (error) => {
          let message = "We couldn't create your card yet.";
          const apiError = error as {
            status?: number;
            data?: unknown;
          };

          if (typeof apiError.status === "number") {
            if (apiError.status === 409) {
              message = "That phone number already has a card.";
            } else if (apiError.status >= 500) {
              message = "The server is on, but the database is not ready yet. Run the Supabase SQL first.";
            } else if (typeof apiError.data === "object" && apiError.data && "error" in apiError.data) {
              const apiMessage = (apiError.data as { error?: string }).error;
              if (apiMessage) {
                message = apiMessage;
              }
            }
          }

          setFormError(message);
          toast({
            title: "Card creation failed",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <MobileLayout>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full justify-center pt-12 pb-24 space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
          <p className="text-muted-foreground text-lg">Enter your details to get your digital punch card.</p>
          {isCheckingServer ? (
          <p className="text-sm text-muted-foreground">Checking local server...</p>
          ) : isServerOffline ? (
            <p className="text-sm text-destructive">{isHostedBackend ? "App server is offline." : "Local server is offline. Start the backend first."}</p>
          ) : (
            <p className="text-sm text-emerald-600">{isHostedBackend ? "App server is ready." : "Local server is ready."}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError("");
                }}
                className="h-14 text-lg rounded-2xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="(555) 123-4567" 
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (formError) setFormError("");
                }}
                className="h-14 text-lg rounded-2xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary"
                required
              />
            </div>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-lg rounded-2xl"
            disabled={createUser.isPending || isCheckingServer}
          >
            {createUser.isPending ? "Creating Card..." : "Get My Card"}
          </Button>
        </form>
      </motion.div>
    </MobileLayout>
  );
}
