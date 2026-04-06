import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/Layouts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

// A simple debounce hook
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

import { useEffect } from "react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);

  const { data: users, isLoading } = useListUsers(
    { search: debouncedSearch || undefined },
    {
      query: { queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined }) }
    }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1">Manage customers and their punch cards.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search name or phone..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Punches</TableHead>
                <TableHead className="text-right">Total Punches</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50 transition-colors relative group">
                    <TableCell className="font-medium">
                      <Link href={`/admin/users/${user.id}`} className="absolute inset-0 z-10">
                        <span className="sr-only">View user</span>
                      </Link>
                      {user.name}
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {user.punchCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{user.totalPunches}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
