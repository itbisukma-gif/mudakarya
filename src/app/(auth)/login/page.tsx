
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    if (email === 'admin@example.com' && password === 'password') {
      toast({
        title: 'Login Berhasil',
        description: 'Anda akan diarahkan ke dashboard.',
      });

      // Set a manual session cookie
      // In a real app, this would be a secure, HTTP-only cookie set by a server
      document.cookie = "session=true; path=/; max-age=3600"; // Expires in 1 hour

      // Redirect to the dashboard. Using window.location.href to force a full page reload
      // which ensures the middleware picks up the new cookie.
      window.location.href = '/dashboard';

    } else {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: 'Email atau password yang Anda masukkan salah.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleLogin}>
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2.5 mb-4">
              <Logo className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight">MudaKarya CarRent</span>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Masukkan kredensial Anda untuk mengakses dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
