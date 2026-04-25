import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import NotFound from "@/pages/not-found";

import InstallPrompt from "./pages/InstallPrompt";
import Onboarding from "./pages/Onboarding";
import Card from "./pages/Card";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/Settings";
import ScanQRCode from "./pages/admin/ScanQRCode";
import { AdminLockGate } from "./components/admin/AdminLockGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 2,
      refetchInterval: 1200,
      refetchIntervalInBackground: true,
    },
  },
});

function Router() {
  const LockedDashboard = () => (
    <AdminLockGate>
      <AdminDashboard />
    </AdminLockGate>
  );

  const LockedUsers = () => (
    <AdminLockGate>
      <AdminUsers />
    </AdminLockGate>
  );

  const LockedUserDetail = () => (
    <AdminLockGate>
      <AdminUserDetail />
    </AdminLockGate>
  );

  const LockedNotifications = () => (
    <AdminLockGate>
      <AdminNotifications />
    </AdminLockGate>
  );

  const LockedSettings = () => (
    <AdminLockGate>
      <AdminSettings />
    </AdminLockGate>
  );

  const LockedScan = () => (
    <AdminLockGate>
      <ScanQRCode />
    </AdminLockGate>
  );

  return (
    <Switch>
      <Route path="/" component={InstallPrompt} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/card" component={Card} />
      <Route path="/notifications" component={Notifications} />

      <Route path="/admin" component={LockedDashboard} />
      <Route path="/admin/users" component={LockedUsers} />
      <Route path="/admin/users/:id" component={LockedUserDetail} />
      <Route path="/admin/scan" component={LockedScan} />
      <Route path="/admin/notifications" component={LockedNotifications} />
      <Route path="/admin/settings" component={LockedSettings} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
