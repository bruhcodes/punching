import { useEffect, useState } from "react";
import { Shield, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      setError("Wrong password. Try again.");
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setUnlocked(true);
    setError("");
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center justify-center">
        <Card className="w-full border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/15 text-cyan-300">
              <Shield className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-white">Admin Lock Screen</CardTitle>
              <CardDescription className="text-slate-300">
                The dashboard stays hidden until the password is entered.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="admin-password" className="text-sm font-medium text-slate-200">
                  Password
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) {
                      setError("");
                    }
                  }}
                  className="h-12 border-white/10 bg-black/30 text-white placeholder:text-slate-400"
                  placeholder="Enter admin password"
                />
              </div>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button type="submit" className="h-12 w-full rounded-2xl text-base">
                <LockKeyhole className="mr-2 h-4 w-4" />
                Unlock Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
