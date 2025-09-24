
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { Loader2, User, KeyRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
        setError(error.message);
        toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: 'Email atau password yang Anda masukkan salah.',
        });
        setIsLoading(false);
    } else {
        toast({
            title: 'Login Berhasil',
            description: 'Anda akan diarahkan ke dashboard.',
        });
        router.push('/dashboard');
        router.refresh();
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col items-center justify-center text-center p-12 bg-black">
        <Image
          src="/login_banner.jpg"
          alt="Banner Armada MudaKarya"
          fill
          className="object-cover opacity-40"
          data-ai-hint="car fleet background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex justify-center items-center gap-2.5 mb-4">
              <Logo className="w-10 h-10 text-primary-foreground" />
              <span className="text-3xl font-bold tracking-tight text-white">MudaKarya RentCar</span>
          </div>
          <h1 className="text-4xl font-bold text-white mt-8">Selamat Datang Kembali!</h1>
          <p className="mt-4 text-white/80 max-w-sm mx-auto">
            Masuk untuk mengelola armada, pesanan, dan seluruh operasional rental mobil Anda.
          </p>
        </div>
        <div className="absolute bottom-6 text-xs text-white/50 z-10">
            &copy; {new Date().getFullYear()} MudaKarya RentCar. All rights reserved.
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 bg-background">
        <div className="mx-auto grid w-[380px] gap-6">
           <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-balance text-muted-foreground">
              Masukkan kredensial Anda untuk mengakses dashboard.
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
             {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
               <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Lupa password?
                </Link>
              </div>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Memproses...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{" "}
            <Link href="#" className="underline">
              Hubungi Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
