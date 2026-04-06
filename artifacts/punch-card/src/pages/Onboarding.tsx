import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateUser } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const createUser = useCreateUser();

  useEffect(() => {
    const existingId = localStorage.getItem("punchCardUserId");
    if (existingId) {
      setLocation("/card");
    }
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    createUser.mutate(
      { data: { name, phone } },
      {
        onSuccess: (user) => {
          localStorage.setItem("punchCardUserId", user.id);
          setLocation("/card");
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 text-lg rounded-2xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-lg rounded-2xl"
            disabled={createUser.isPending}
          >
            {createUser.isPending ? "Creating Card..." : "Get My Card"}
          </Button>
        </form>
      </motion.div>
    </MobileLayout>
  );
}
