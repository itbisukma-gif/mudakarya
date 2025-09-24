
'use client';

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from 'lucide-react';

// Mock data, in a real app this would come from a server/auth context
const adminUser = {
  name: 'Admin 1',
  email: 'admin.satu@example.com',
};

export default function ProfileManagementPage() {
  const { toast } = useToast();
  const [name, setName] = useState(adminUser.name);
  const [email, setEmail] = useState(adminUser.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : '?';
  };

  const handleProfileSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      // Here you would call your server action to update the user profile
      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda telah berhasil disimpan.",
      });
      setIsSaving(false);
    }, 1000);
  };

  const handlePasswordSave = () => {
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: "Password Tidak Cocok",
        description: "Pastikan password baru dan konfirmasi password sama.",
      });
      return;
    }
    if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: "Password Terlalu Pendek",
            description: "Password minimal harus 6 karakter.",
        });
        return;
    }

    setIsPasswordSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Password Diperbarui",
        description: "Password Anda telah berhasil diubah.",
      });
      setPassword('');
      setConfirmPassword('');
      setIsPasswordSaving(false);
    }, 1000);
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Profil</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun dan keamanan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 text-center">
              <Avatar className="mx-auto h-24 w-24 mb-4">
                  <AvatarFallback className="text-4xl">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Profil</CardTitle>
                    <CardDescription>Perbarui nama dan alamat email Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                     <Button onClick={handleProfileSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan Profil
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Ubah Password</CardTitle>
                    <CardDescription>Ganti password Anda secara berkala untuk menjaga keamanan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password Baru</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                     <Button onClick={handlePasswordSave} disabled={isPasswordSaving}>
                        {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ubah Password
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
