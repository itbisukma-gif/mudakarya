'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/icons';
import { UserCheck } from 'lucide-react';
import type { Order } from '@/lib/types';

interface InvoiceTemplateProps {
    order: Order;
    rentalPeriod: string;
    isValidated?: boolean;
}

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

export function InvoiceTemplate({ order, rentalPeriod, isValidated = false }: InvoiceTemplateProps) {

    const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
    
    const displayStatus = order.status === 'disetujui' || order.status === 'selesai' ? 'Lunas' : order.status;

    return (
        <Card className="w-full max-w-md shadow-lg printable-card">
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
                        <Badge variant={getStatusVariant(displayStatus!)} className="capitalize">{displayStatus}</Badge>
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
                        <span className='font-medium'>{rentalPeriod}</span>
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

                {isValidated && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <span>Divalidasi oleh: <strong>Admin</strong></span>
                    </div>
                )}
                 {!isValidated && (
                     <p className="text-xs text-center text-muted-foreground pt-2">
                        Pembayaran telah divalidasi. Terima kasih telah memilih layanan kami.
                    </p>
                )}


            </CardContent>
        </Card>
    );
}
