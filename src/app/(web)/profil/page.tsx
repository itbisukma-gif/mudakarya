
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, LogIn } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Mock user data. In a real app, this would come from an authentication context.
const mockUser = {
  name: 'Budi Santoso',
  email: 'budi.santoso@email.com',
  isLoggedIn: true,
};

const guestUser = {
  name: 'Tamu',
  email: 'Silakan login untuk melihat profil.',
  isLoggedIn: false,
};

export default function ProfilePage() {
  const [user, setUser] = useState(guestUser);

  // Simulate checking login state
  useEffect(() => {
    // In a real app, you would check a session or token here.
    // For this example, we'll just use the mock user.
    // To test the guest view, change mockUser.isLoggedIn to false.
    if (mockUser.isLoggedIn) {
      setUser(mockUser);
    }
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : '?';
  };

  return (
    <div className="container py-8 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
             <Avatar className="mx-auto h-24 w-24 mb-4">
                <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl">{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            {user.isLoggedIn ? (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Riwayat Pesanan</h3>
                    <div className="border rounded-lg p-4 text-center text-muted-foreground">
                        <p>Tidak ada riwayat pesanan.</p>
                        <Button asChild variant="link" className="mt-2">
                           <Link href="/">Mulai sewa sekarang</Link>
                        </Button>
                    </div>
                </div>
                <div className="mt-6">
                    <Button variant="outline" className="w-full">
                        <Shield className="mr-2 h-4 w-4" />
                        Ubah Password
                    </Button>
                </div>
              </>
            ) : (
                <div className="text-center mt-6">
                    <p className="text-muted-foreground mb-4">Anda belum login.</p>
                    <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Login ke Akun Anda
                        </Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
