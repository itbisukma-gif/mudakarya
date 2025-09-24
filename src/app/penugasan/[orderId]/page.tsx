
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Check, X, Car, User, Truck, MessageSquareWarning } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import type { Order, Vehicle, Driver } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Logo } from '@/components/icons';
import { updateOrderStatus } from '@/app/dashboard/orders/actions';
import { updateVehicleStatus } from '@/app/dashboard/armada/actions';
import { updateDriverStatus } from '@/app/dashboard/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function AssignmentComponent() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const [isProcessing, startTransition] = useTransition();
    const [actionTaken, setActionTaken] = useState<'accepted' | 'rejected' | null>(null);

    const [order, setOrder] = useState<Order | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        
        const orderId = params.orderId as string;
        if (orderId) {
            const fetchOrderData = async () => {
                setIsLoading(true);
                const { data: orderData, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();
                
                if (error || !orderData) {
                    notFound();
                    return;
                }
                
                setOrder(orderData);

                const [vehicleRes, driverRes] = await Promise.all([
                    supabase.from('vehicles').select('*').eq('id', orderData.vehicleId).single(),
                    supabase.from('drivers').select('*').eq('id', orderData.driverId).single()
                ]);

                setVehicle(vehicleRes.data);
                setDriver(driverRes.data);
                setIsLoading(false);
            }
            fetchOrderData();
        } else {
            setIsLoading(false);
        }
    }, [params.orderId, supabase]);

    const handleAccept = () => {
        if (!order || !driver) return;
        startTransition(async () => {
            // 1. Update Order Status to 'dipesan'
            const { error: orderError } = await updateOrderStatus(order.id, 'dipesan');
            if (orderError) {
                toast({ variant: 'destructive', title: 'Gagal Update Order', description: orderError.message });
                return;
            }

            // 2. Update Driver Status to 'Bertugas'
            const { error: driverError } = await updateDriverStatus(driver.id, 'Bertugas');
            if (driverError) {
                toast({ variant: 'destructive', title: 'Gagal Update Status Driver', description: driverError.message });
                return;
            }
            
            // 3. Update Vehicle Status to 'dipesan' (if not partner unit)
            if (!order.isPartnerUnit) {
                const { error: vehicleError } = await updateVehicleStatus(order.vehicleId, 'dipesan');
                 if (vehicleError) {
                    toast({ variant: 'destructive', title: 'Gagal Update Status Mobil', description: vehicleError.message });
                    return;
                 }
            }

            setActionTaken('accepted');
            toast({ title: 'Penugasan Diterima!', description: 'Terima kasih telah mengkonfirmasi.' });
        });
    };
    
    const handleReject = () => {
        startTransition(async () => {
             // Logic to notify admin can be added here if needed in the future
            setActionTaken('rejected');
            toast({
                variant: 'destructive',
                title: 'Penugasan Ditolak',
                description: 'Admin telah diberitahu. Terima kasih atas konfirmasinya.',
            });
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!order || !vehicle || !driver) {
        notFound();
    }

    const isActionable = order.status === 'pending' && !actionTaken;
    const isAcceptedInDb = order.status === 'dipesan' || order.status === 'disetujui' || order.status === 'selesai';

    return (
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2.5 mb-4">
                    <Logo className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-bold tracking-tight">MudaKarya CarRent</span>
                </div>
                <CardTitle className="text-2xl">Detail Penugasan</CardTitle>
                <CardDescription>Order ID: <span className='font-mono'>{order.id}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Pelanggan</span>
                        <span className='font-medium'>{order.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Car className="h-4 w-4" /> Kendaraan</span>
                        <span className='font-medium text-right'>{vehicle.brand} {vehicle.name}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Truck className="h-4 w-4" /> Layanan</span>
                        <span className='font-medium capitalize'>{order.service}</span>
                    </div>
                </div>
                {isActionable && (
                    <p className="text-sm text-muted-foreground text-center px-4">
                        Halo, <span className="font-bold">{driver.name}</span>. Anda diminta untuk melayani pesanan di atas. Mohon terima atau tolak penugasan ini.
                    </p>
                )}
            </CardContent>
            <CardFooter className='flex flex-col gap-3'>
                {isActionable && (
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" className='border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground' onClick={handleReject} disabled={isProcessing}>
                             {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                            Tolak
                        </Button>
                        <Button className='bg-green-600 hover:bg-green-700' onClick={handleAccept} disabled={isProcessing}>
                             {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Terima
                        </Button>
                    </div>
                )}
                
                {(isAcceptedInDb || actionTaken === 'accepted') && (
                     <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                        <Check className="h-4 w-4 !text-green-600" />
                        <AlertTitle className="font-semibold">Penugasan Diterima</AlertTitle>
                        <AlertDescription className="text-green-700">
                           Terima kasih atas konfirmasinya. Silakan hubungi admin untuk info lebih lanjut.
                        </AlertDescription>
                    </Alert>
                )}

                {actionTaken === 'rejected' && (
                     <Alert variant="destructive">
                        <MessageSquareWarning className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Penugasan Ditolak</AlertTitle>
                        <AlertDescription>
                           Anda telah menolak penugasan ini. Silakan hubungi admin untuk konfirmasi.
                        </AlertDescription>
                    </Alert>
                )}

                 {order.status === 'tidak disetujui' && (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Order Dibatalkan</AlertTitle>
                        <AlertDescription>
                            Order ini telah dibatalkan oleh Admin.
                        </AlertDescription>
                    </Alert>
                )}
            </CardFooter>
        </Card>
    );
}

export default function AssignmentPage() {
    return <AssignmentComponent />;
}
