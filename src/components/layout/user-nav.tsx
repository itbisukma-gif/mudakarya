
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

function EditAccountForm({ user, onUpdate }: { user: any, onUpdate: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(user?.user_metadata?.full_name || '');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleSaveChanges = async () => {
        setIsLoading(true);
        let updates: any = {};
        if (password) {
            updates.password = password;
        }
        if (name !== user?.user_metadata?.full_name) {
            updates.data = { full_name: name };
        }

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase.auth.updateUser(updates);
            if (error) {
                 toast({
                    variant: "destructive",
                    title: "Gagal Memperbarui Akun",
                    description: error.message
                });
            } else {
                 toast({
                    title: "Perubahan Disimpan",
                    description: "Informasi akun Anda telah berhasil diperbarui."
                });
                onUpdate();
                setOpen(false);
            }
        } else {
            setOpen(false);
        }
        setIsLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Kelola Akun
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Kelola Akun</DialogTitle>
                    <DialogDescription>
                        Perbarui detail akun Anda di sini. Klik simpan jika sudah selesai.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nama
                        </Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input id="email" type="email" value={user?.email || ''} className="col-span-3" disabled />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password Baru
                        </Label>
                        <Input id="password" type="password" placeholder="Kosongkan jika tidak diubah" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSaveChanges} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export function UserNav() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUser = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     setUser(user);
     setLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const name = user?.user_metadata?.full_name || user?.email || "Admin";
  const email = user?.email || "";

  const getInitials = (nameStr: string) => {
    if (!nameStr) return '?';
    const parts = nameStr.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : '?';
  };
  
  const initials = getInitials(name);

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Dialog>
              <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                  </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                      <DialogTitle>Profil Akun</DialogTitle>
                      <DialogDescription>Pratinjau informasi akun Anda.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="flex items-center space-x-4">
                       <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="text-lg font-semibold">{name}</h4>
                          <p className="text-sm text-muted-foreground">{email}</p>
                        </div>
                    </div>
                  </div>
                  <DialogFooter>
                      <EditAccountForm user={user} onUpdate={fetchUser} />
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/logout">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

