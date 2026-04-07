import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useSendNotification } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, BellRing, SendHorizonal, Sparkles } from "lucide-react";
import { useDebounceValue } from "./Users";

const templates = [
  "Double punches today until 5 PM.",
  "Your next reward is close. Stop by this afternoon.",
  "Flash deal: show your QR today for a surprise bonus punch.",
];

export default function AdminNotifications() {
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);

  const { data: users, isLoading } = useListUsers(
    { search: debouncedSearch || undefined },
    {
      query: { queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined }) },
    },
  );

  const sendNotification = useSendNotification();

  const toggleUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const selectAll = () => {
    if (!users) return;
    setSelectedUsers(selectedUsers.size === users.length ? new Set() : new Set(users.map((user) => user.id)));
  };

  const handleSend = () => {
    if (selectedUsers.size === 0) {
      toast.error("Pick at least one user.");
      return;
    }
    if (!message.trim()) {
      toast.error("Write a message first.");
      return;
    }

    sendNotification.mutate(
      { data: { userIds: Array.from(selectedUsers), message: message.trim() } },
      {
        onSuccess: () => {
          toast.success(`Saved and sent to ${selectedUsers.size} user${selectedUsers.size === 1 ? "" : "s"}.`);
          setMessage("");
          setSelectedUsers(new Set());
        },
        onError: () => toast.error("Notification failed. Check that the API server is online."),
      },
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-900/5">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Messaging center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Save in-app messages instantly and send web-push alerts to anyone who already enabled notifications on their card.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem] border-white/70 bg-white/85 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Compose campaign</CardTitle>
              <CardDescription>These messages show inside the app even if the user never enabled push.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Button key={template} variant="outline" size="sm" className="rounded-full" onClick={() => setMessage(template)}>
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    {template}
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Hey! Double punches today until 5 PM."
                className="min-h-[170px] resize-none rounded-[1.5rem] p-4 text-base"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BellRing className="h-4 w-4 text-cyan-700" />
                    Audience
                  </div>
                  <p className="mt-2 text-2xl font-bold">{selectedUsers.size}</p>
                  <p className="text-sm text-muted-foreground">selected users</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <SendHorizonal className="h-4 w-4 text-cyan-700" />
                    Delivery
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    In-app saves immediately. Push alerts only reach people who already enabled notifications.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSend}
                className="h-12 w-full rounded-2xl"
                disabled={selectedUsers.size === 0 || !message.trim() || sendNotification.isPending}
              >
                {sendNotification.isPending ? "Sending..." : "Send campaign"}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-[620px] flex-col rounded-[2rem] border-white/70 bg-white/85 shadow-xl shadow-slate-900/5">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Recipients</CardTitle>
                  <CardDescription>Select who should get this campaign.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={selectAll}>
                  {users && selectedUsers.size === users.length ? "Clear all" : "Select all"}
                </Button>
              </div>
              <div className="relative pt-3">
                <Search className="absolute left-3 top-[26px] h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="rounded-2xl pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading users...</div>
              ) : users && users.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                    >
                      <Checkbox checked={selectedUsers.has(user.id)} onCheckedChange={() => toggleUser(user.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="truncate text-sm text-muted-foreground">{user.phone}</div>
                      </div>
                      <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {user.punchCount} punches
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No users found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
