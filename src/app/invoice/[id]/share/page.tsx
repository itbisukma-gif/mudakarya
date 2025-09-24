'use client'

import { useParams, notFound, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import type { Html2PdfOptions } from 'html2pdf.js';
import { InvoiceTemplate } from '@/components/invoice-template';

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

    const handleDownload = async () => {
        setIsDownloading(true);
        const element = document.getElementById('invoice-pdf-container');
        if (!element) {
            toast({ variant: 'destructive', title: 'Terjadi Kesalahan', description: 'Elemen invoice tidak ditemukan.' });
            setIsDownloading(false);
            return;
        }
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt: Html2PdfOptions = {
              margin:       0.5,
              filename:     `invoice-${order!.id}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
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
                <CardFooter className='flex flex-col gap-4 no-print'>
                    <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Halaman Utama
                    </Button>
                </CardFooter>
            </Card>
        )
    }


    return (
        <div className="w-full max-w-md">
            <div id="invoice-pdf-container">
                <InvoiceTemplate order={order} rentalPeriod={formattedRentalPeriod} />
            </div>
            
            <CardFooter className='flex-col gap-2 no-print mt-4 p-0'>
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
                <Button asChild className="w-full mt-2">
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
        </div>
    );
}

export default function SharedInvoicePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SharedInvoiceComponent />
        </Suspense>
    )
}
