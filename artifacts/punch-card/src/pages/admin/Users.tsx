import { useEffect, useState } from "react";
import {
  useCreateUser,
  useDeleteUser,
  useGetSettings,
  useListUsers,
  useUpdateUser,
  getGetStatsQueryKey,
  getListUsersQueryKey,
  type User,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type UserDraft = {
  name: string;
  phone: string;
  avatarUrl: string;
};

const emptyDraft: UserDraft = {
  name: "",
  phone: "",
  avatarUrl: "",
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: settings } = useGetSettings();
  const accentColor = settings?.accentColor || "#06b6d4";
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<UserDraft>(emptyDraft);
  const debouncedSearch = useDebounceValue(search, 300);

  const { data: users, isLoading } = useListUsers(
    { search: debouncedSearch || undefined },
    {
      query: {
        queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined }),
      },
    },
  );

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditUser(null);
  };

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined }) });
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const openCreate = () => {
    resetDraft();
    setCreateOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setDraft({
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl || "",
    });
  };

  const handleSave = () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      toast.error("Name and phone are required.");
      return;
    }

    const payload = {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      avatarUrl: draft.avatarUrl.trim() || undefined,
    };

    if (editUser) {
      updateUser.mutate(
        { id: editUser.id, data: payload },
        {
          onSuccess: () => {
            toast.success("User updated");
            refreshUsers();
            setEditUser(null);
            resetDraft();
          },
          onError: () => toast.error("Couldn't update that user."),
        },
      );
      return;
    }

    createUser.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast.success("User added");
          refreshUsers();
          setCreateOpen(false);
          resetDraft();
        },
        onError: () => toast.error("Couldn't create that user."),
      },
    );
  };

  const handleDelete = (user: User) => {
    if (!confirm(`Delete ${user.name}?`)) return;

    deleteUser.mutate(
      { id: user.id },
        {
          onSuccess: () => {
            toast.success("User removed");
            refreshUsers();
        },
        onError: () => toast.error("Couldn't delete that user."),
      },
    );
  };

  const busy = createUser.isPending || updateUser.isPending;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-900/5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: accentColor }}>Customer studio</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Users</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Add customers, edit phone numbers, attach profile images, and manage every punch-card account from one place.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or phone..."
                  className="h-11 rounded-2xl bg-background pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button className="h-11 rounded-2xl px-5" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-white/70 bg-white/85 shadow-xl shadow-slate-900/5">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Customer list</CardTitle>
            <CardDescription>Use edit to update names, phones, or avatar images without touching the database manually.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Punches</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 rounded-2xl">
                            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                            <AvatarFallback className="rounded-2xl bg-slate-950 text-white">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                          {user.punchCount} / {user.totalPunches}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl">Open</Button>
                          </Link>
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(user)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl text-destructive" onClick={() => handleDelete(user)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No users found yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={createOpen || !!editUser} onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditUser(null);
            resetDraft();
          }
        }}>
          <DialogContent className="rounded-[2rem] sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editUser ? "Edit customer" : "Add customer"}</DialogTitle>
              <DialogDescription>
                Add a customer profile image URL if you want their admin card to feel more personalized.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name</Label>
                <Input id="user-name" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone</Label>
                <Input id="user-phone" value={draft.phone} onChange={(e) => setDraft((current) => ({ ...current, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-avatar">Avatar image URL</Label>
                <Input
                  id="user-avatar"
                  placeholder="https://..."
                  value={draft.avatarUrl}
                  onChange={(e) => setDraft((current) => ({ ...current, avatarUrl: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCreateOpen(false);
                resetDraft();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={busy}>
                {busy ? "Saving..." : editUser ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
