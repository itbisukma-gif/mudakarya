import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="relative hidden items-center justify-center bg-primary text-primary-foreground lg:flex">
         <Image
            src="/login-banner.jpg"
            alt="Banner rental mobil"
            fill
            className="object-cover opacity-20"
        />
        <div className="relative z-10 mx-auto w-full max-w-md text-center">
            <h1 className="text-4xl font-bold">Selamat Datang Kembali!</h1>
            <p className="mt-4 text-lg">Masuk untuk mengelola armada dan pesanan Anda.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
