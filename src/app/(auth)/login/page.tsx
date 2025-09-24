
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Mail, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2.5 mb-4">
              <Logo className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight">MudaKarya CarRent</span>
            </div>
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-muted-foreground mt-2">Masukkan kredensial Anda untuk mengakses dashboard.</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10"
                      />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                   <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="pl-10"
                        />
                   </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Memproses...' : 'Sign In'}
              </Button>
          </div>
        </form>
    </div>
  );
}
