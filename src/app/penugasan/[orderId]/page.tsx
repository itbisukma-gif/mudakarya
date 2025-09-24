
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Check, X, Car, User, Calendar, Truck } from 'lucide-react';
import { useState, useEffect, useMemo, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import type { Order, Vehicle, Driver } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons';
import { updateOrderStatus } from '@/app/dashboard/orders/actions';
import { updateVehicleStatus } from '@/app/dashboard/armada/actions';
import { updateDriverStatus } from '@/app/dashboard/actions';


function AssignmentComponent() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const [isProcessing, startTransition] = useTransition();
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

            toast({ title: 'Penugasan Diterima!', description: 'Terima kasih telah mengkonfirmasi.' });
            // Redirect or show a success message. For now, we'll just disable buttons.
            // A page refresh on the dashboard will show the new status.
        });
    };
    
    const handleReject = () => {
        // For now, we just inform the driver. Admin will need to re-assign manually.
        toast({
            variant: 'destructive',
            title: 'Penugasan Ditolak',
            description: 'Admin telah diberitahu. Terima kasih atas konfirmasinya.',
        });
        router.push('/'); // Redirect to home
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!order || !vehicle || !driver) {
        notFound();
    }

    const isActionable = order.status === 'pending';
    const isAccepted = order.status === 'dipesan' || order.status === 'disetujui' || order.status === 'selesai';

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
                <p className="text-sm text-muted-foreground text-center px-4">
                    Halo, <span className="font-bold">{driver.name}</span>. Anda diminta untuk melayani pesanan di atas. Mohon terima atau tolak penugasan ini.
                </p>
            </CardContent>
            <CardFooter className='flex flex-col gap-2'>
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
                {isAccepted && (
                     <div className="w-full text-center p-4 bg-green-50 text-green-800 rounded-md">
                        <p className="font-semibold">Penugasan telah Anda terima.</p>
                        <p className="text-sm">Admin akan melanjutkan proses verifikasi order.</p>
                    </div>
                )}
                 {order.status === 'tidak disetujui' && (
                     <div className="w-full text-center p-4 bg-red-50 text-red-800 rounded-md">
                        <p className="font-semibold">Order ini telah dibatalkan oleh Admin.</p>
                    </div>
                )}

            </CardFooter>
        </Card>
    );
}

export default function AssignmentPage() {
    return <AssignmentComponent />;
}

