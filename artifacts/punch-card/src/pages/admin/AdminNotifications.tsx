import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useSendNotification } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useDebounceValue } from "./Users";

export default function AdminNotifications() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  const { data: users, isLoading } = useListUsers(
    { search: debouncedSearch || undefined },
    {
      query: { queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined }) }
    }
  );

  const sendNotification = useSendNotification();

  const toggleUser = (id: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedUsers(newSet);
  };

  const selectAll = () => {
    if (!users) return;
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleSend = () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    sendNotification.mutate(
      { data: { userIds: Array.from(selectedUsers), message } },
      {
        onSuccess: () => {
          toast.success(`Notification sent to ${selectedUsers.size} users`);
          setMessage("");
          setSelectedUsers(new Set());
        },
        onError: () => toast.error("Failed to send notifications")
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Send messages and offers to your customers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>
                This message will appear in the user's app notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Hey! Double punches today until 5PM! ☕" 
                className="min-h-[150px] resize-none text-base p-4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium">Sending to {selectedUsers.size} users</span>
                <Button 
                  onClick={handleSend} 
                  disabled={selectedUsers.size === 0 || !message.trim() || sendNotification.isPending}
                >
                  {sendNotification.isPending ? "Sending..." : "Send Notification"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Select Recipients</CardTitle>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {users && selectedUsers.size === users.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : users && users.length > 0 ? (
                <div className="divide-y">
                  {users.map(user => (
                    <label 
                      key={user.id} 
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox 
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No users found</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
