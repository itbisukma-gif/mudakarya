
'use client'

import { useParams, notFound, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2, UserCheck, Share2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import type { Order, Vehicle } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Html2PdfOptions } from 'html2pdf.js';
import { InvoiceTemplate } from '@/components/invoice-template';

function InvoiceComponent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const days = searchParams.get('days');

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
        if (typeof window !== 'undefined') {
            const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('session='));
            if (sessionCookie) {
                setIsAdmin(true);
            }
        }
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
                    notFound();
                } else {
                    setOrder(data);
                    const { data: vehicleData } = await supabase.from('vehicles').select('*').eq('id', data.vehicleId).single();
                    setVehicle(vehicleData);
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
    
    const shareUrl = useMemo(() => {
        if (!order) return '#';
        let url = `/invoice/${order.id}/share`;
        const params = new URLSearchParams();
        if (startDateStr) params.append('startDate', startDateStr);
        if (endDateStr) params.append('endDate', endDateStr);
        if (days) params.append('days', days);
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
    }, [order, startDateStr, endDateStr, days]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!order || !vehicle) {
        notFound();
    }
    
    if (order.status !== 'disetujui' && order.status !== 'selesai') {
        return (
             <Card className="w-full max-w-md shadow-lg text-center">
                <CardHeader>
                    <div className="flex justify-center items-center gap-2.5 mb-4">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Invoice Belum Tersedia</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Invoice hanya dapat dibuat untuk pesanan yang telah lunas dan disetujui. Status pesanan ini adalah <span className='font-semibold capitalize'>{order.status}</span>.</p>
                </CardContent>
                <CardFooter className='flex flex-col gap-4'>
                    <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/keuangan')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Halaman Keuangan
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <div className="w-full max-w-md">
            <div id="invoice-pdf-container">
                 <InvoiceTemplate order={order} vehicle={vehicle} rentalPeriod={formattedRentalPeriod} isValidated={isAdmin} />
            </div>

            <div className='flex flex-col gap-2 mt-4'>
                 <Button className="w-full" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    {isDownloading ? 'Mengunduh...' : 'Download PDF'}
                </Button>
                <Button asChild className="w-full" variant="outline">
                    <Link href={shareUrl} target="_blank">
                        <Share2 className="h-4 w-4 mr-2" />
                        Bagikan ke Pelanggan
                    </Link>
                </Button>
                <Button variant="link" size="sm" className='text-muted-foreground' onClick={() => router.push('/dashboard/keuangan')}>
                    <ArrowLeft className="h-3 w-3 mr-1.5" />
                    Kembali ke Halaman Keuangan
                </Button>
            </div>
        </div>
    );
}

export default function InvoicePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <InvoiceComponent />
        </Suspense>
    )
}
