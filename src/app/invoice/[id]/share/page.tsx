'use client'

import { useParams, notFound, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Logo, WhatsAppIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Order } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
        case 'Lunas':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'tidak disetujui':
            return 'destructive';
        default:
            return 'secondary';
    }
}

function SharedInvoiceComponent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const days = searchParams.get('days');
    
    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        const orderId = params.id as string;
        if (orderId) {
            const fetchOrder = async () => {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();
                
                if (error || !data) {
                    setOrder(null);
                } else {
                    setOrder(data);
                }
                setIsLoading(false);
            }
            fetchOrder();
        } else {
            setIsLoading(false);
        }
    }, [params.id, supabase]);

    const formattedRentalPeriod = useMemo(() => {
        if (startDateStr && endDateStr) {
            try {
                const start = parseISO(startDateStr);
                const end = parseISO(endDateStr);
                return `${format(start, 'd LLL yy', { locale: id })} - ${format(end, 'd LLL yy', { locale: id })}`;
            } catch (error) {
                console.error("Error parsing date strings:", error);
                 return days ? `${days} hari` : '-';
            }
        }
        return days ? `${days} hari` : '-';
    }, [startDateStr, endDateStr, days]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!order || (order.status !== 'disetujui' && order.status !== 'selesai')) {
        return (
             <Card className="w-full max-w-md shadow-lg text-center">
                <CardHeader>
                    <div className="flex justify-center items-center gap-2.5 mb-4">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Invoice Tidak Ditemukan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Invoice hanya tersedia untuk pesanan yang telah lunas. Jika Anda merasa ini adalah kesalahan, silakan hubungi admin.</p>
                </CardContent>
                <CardFooter className='flex flex-col gap-4'>
                    <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Halaman Utama
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
    
    const displayStatus = order.status === 'disetujui' || order.status === 'selesai' ? 'Lunas' : order.status;

    const handleDownload = async () => {
        setIsDownloading(true);
        const element = document.getElementById('invoice-card-for-pdf');
        if (!element) {
            toast({ variant: 'destructive', title: 'Terjadi Kesalahan', description: 'Elemen invoice tidak ditemukan.' });
            setIsDownloading(false);
            return;
        }
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
              margin:       0.5,
              filename:     `invoice-${order.id}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true },
              jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(element).save();
            toast({ title: 'Invoice Diunduh!', description: 'File PDF berhasil dibuat dan diunduh.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Gagal Mengunduh', description: 'Terjadi kesalahan saat membuat file PDF.' });
            console.error(err);
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <Card id="invoice-card-for-pdf" className="w-full max-w-md shadow-lg printable-card">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2.5 mb-4">
                    <Logo className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-bold tracking-tight">MudaKarya CarRent</span>
                </div>
                <CardTitle className="text-2xl">Rincian Pembayaran</CardTitle>
                <CardDescription>Order ID: <span className='font-mono'>{order.id}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status Pembayaran</span>
                        <Badge variant={getStatusVariant(displayStatus)} className="capitalize">{displayStatus}</Badge>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Pelanggan</span>
                        <span className='font-medium'>{order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Metode Pembayaran</span>
                        <span className='font-medium'>{order.paymentMethod}</span>
                    </div>
                     <Separator />
                     <h4 className='font-semibold pt-2'>Detail Sewa</h4>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Kendaraan</span>
                        <span className='font-medium'>{order.carName}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Periode</span>
                        <span className='font-medium'>{formattedRentalPeriod}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Layanan</span>
                        <span className='font-medium'>{order.service}</span>
                    </div>
                    <Separator />
                    <h4 className='font-semibold pt-2'>Rincian Biaya</h4>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tagihan</span>
                        <span className='font-medium'>{formatCurrency(order.total || 0)}</span>
                    </div>
                    
                    <Separator className='my-2' />
                     <div className="flex justify-between items-baseline pt-1">
                        <span className="text-base font-bold">Total Lunas</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(order.total || 0)}</span>
                    </div>
                </div>

                 <p className="text-xs text-center text-muted-foreground pt-2">
                    Pembayaran telah divalidasi. Terima kasih telah memilih layanan kami.
                </p>


            </CardContent>
            <CardFooter className='flex-col gap-2 no-print'>
                 <div className='flex w-full gap-2'>
                    <Button variant="outline" className="w-full" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Cetak
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleDownload} disabled={isDownloading}>
                         {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        {isDownloading ? 'Mengunduh...' : 'Download PDF'}
                    </Button>
                 </div>
                 <Separator className='my-2' />
                <Button asChild className="w-full">
                    <Link href="https://wa.me/6281234567890" target="_blank">
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        Hubungi Admin
                    </Link>
                </Button>
                <Button variant="link" size="sm" className='text-muted-foreground' onClick={() => router.push('/')}>
                    <ArrowLeft className="h-3 w-3 mr-1.5" />
                    Kembali ke Halaman Utama
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function SharedInvoicePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SharedInvoiceComponent />
        </Suspense>
    )
}
