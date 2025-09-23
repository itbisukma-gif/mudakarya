
'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Send, Eye, Share, CheckCircle, Car, ShieldCheck, Clock, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Driver, Order, OrderStatus } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { id } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';
import { updateDriverStatus } from '../actions';
import { updateVehicleStatus } from '../armada/actions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WhatsAppIcon } from '@/components/icons';

async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
    return { data, error };
}

async function updateOrderDriver(orderId: string, driverName: string, driverId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('orders')
        .update({ driver: driverName, driverId: driverId })
        .eq('id', orderId);
    return { data, error };
}


const getStatusInfo = (status: OrderStatus | null) => {
    switch (status) {
        case 'disetujui':
            return { label: 'Disetujui', className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' };
        case 'pending':
            return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100' };
        case 'tidak disetujui':
            return { label: 'Ditolak', className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100' };
        case 'selesai':
            return { label: 'Selesai', className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100' };
        default:
            return { label: 'Unknown', className: 'bg-secondary text-secondary-foreground hover:bg-secondary' };
    }
}

function OrderCard({ order, drivers, onDataChange }: { order: Order, drivers: Driver[], onDataChange: () => void }) {
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [isPending, startTransition] = useTransition();
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const statusInfo = getStatusInfo(order.status);
    const requiresDriver = order.service?.toLowerCase().includes("supir") || order.service?.toLowerCase().includes("all");

    const orderDate = new Date(order.created_at);
    const timeSinceCreation = isClient ? formatDistanceToNow(orderDate, { addSuffix: true, locale: id }) : '...';
    const hoursSinceCreation = differenceInHours(new Date(), orderDate);
    const needsAttention = order.status === 'pending' && hoursSinceCreation > 1;

    const handleStatusChange = (newStatus: OrderStatus) => {
        startTransition(async () => {
            const { error } = await updateOrderStatus(order.id, newStatus);
            if (error) {
                toast({ variant: 'destructive', title: 'Gagal Memperbarui Status', description: error.message });
                return;
            }

            if (newStatus === 'disetujui') {
                await updateVehicleStatus(order.vehicleId, 'disewa');
            } else if (newStatus === 'tidak disetujui' || newStatus === 'selesai') {
                await updateVehicleStatus(order.vehicleId, 'tersedia');
                if (order.driverId) {
                    await updateDriverStatus(order.driverId, 'Tersedia');
                }
            }

            toast({ title: 'Status Diperbarui', description: `Status pesanan ${order.id} telah diubah.` });
            onDataChange();
        });
    };

    const handleDriverChange = (driverValue: string) => {
        const [driverId, driverName] = driverValue.split('|');
        if (!driverId || !driverName) return;

        startTransition(async () => {
            if (order.driverId) {
                await updateDriverStatus(order.driverId, 'Tersedia');
            }

            const { error: orderError } = await updateOrderDriver(order.id, driverName, driverId);
            if (orderError) {
                toast({ variant: 'destructive', title: 'Gagal Menugaskan Driver', description: orderError.message });
                return;
            }

            const { error: driverError } = await updateDriverStatus(driverId, 'Bertugas');
            if (driverError) {
                toast({ variant: 'destructive', title: 'Gagal Memperbarui Status Driver', description: driverError.message });
            } else {
                toast({ title: "Driver Ditugaskan", description: `${driverName} telah ditugaskan ke pesanan ${order.id}.` });
            }

            onDataChange();
        });
    };
    
    const handleSelesaikanPesanan = () => {
        handleStatusChange('selesai');
    };

    const invoiceUrl = useMemo(() => {
        // Since we don't have start/end dates in the order object,
        // we can't reliably add them here for now.
        // The link will still work, just without the period displayed on the invoice page.
        return `/invoice/${order.id}`;
    }, [order.id]);

    const whatsAppInvoiceUrl = useMemo(() => {
        if (!order.customerPhone || typeof window === 'undefined') return '#';

        const domain = window.location.origin;
        const shareableInvoiceUrl = `${domain}/invoice/${order.id}/share`;
        
        const message = `Halo ${order.customerName}, terima kasih telah memesan di MudaKarya CarRent. Pembayaran Anda telah kami konfirmasi. Berikut adalah rincian invoice untuk pesanan Anda: ${shareableInvoiceUrl}`;
        
        // Basic phone number cleaning and formatting for Indonesia
        let formattedPhone = order.customerPhone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('62')) {
            formattedPhone = '62' + formattedPhone;
        }

        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }, [order.id, order.customerName, order.customerPhone]);

    return (
         <Card className="flex flex-col">
            <CardHeader className='pb-4'>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{order.customerName}</CardTitle>
                        <CardDescription className="font-mono text-xs">{order.id}</CardDescription>
                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                            <Clock className="h-3 w-3" />
                            <span>dibuat {timeSinceCreation}</span>
                        </div>
                    </div>
                     <Badge variant="outline" className={cn("capitalize text-xs", statusInfo.className)}>{statusInfo.label}</Badge>
                </div>
                <div className="flex items-center gap-2 pt-3 text-sm text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>{order.carName}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 {needsAttention && (
                    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Perlu Perhatian</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                            Pesanan ini belum ditanggapi lebih dari 1 jam.
                        </AlertDescription>
                    </Alert>
                )}
                <Separator />
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Layanan</span>
                        <span className="font-medium">{order.service}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Driver</span>
                         {requiresDriver ? (
                            <Select 
                                value={order.driverId ? `${order.driverId}|${order.driver}` : undefined} 
                                onValueChange={handleDriverChange}
                                disabled={order.status === 'disetujui' || order.status === 'selesai' || isPending}
                            >
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Pilih Driver" />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map(d => 
                                        <SelectItem 
                                            key={d.id} 
                                            value={`${d.id}|${d.name}`}
                                            disabled={d.status === 'Bertugas' && order.driver !== d.name}
                                            className="text-xs"
                                        >
                                            {d.name} ({d.status})
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        ) : (
                            <span className="font-medium">-</span>
                        )}
                    </div>
                </div>
                 <Separator />
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 justify-between items-center">
                <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="w-full sm:w-auto justify-start text-muted-foreground hover:text-primary">
                            <Eye className="h-4 w-4 mr-2" />
                            Bukti Bayar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Bukti Pembayaran</DialogTitle>
                            <DialogDescription>
                                Order ID: {order.id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-4 aspect-video w-full">
                        {order.paymentProof ? (
                           <Image 
                                src={order.paymentProof} 
                                alt="Bukti Pembayaran" 
                                fill
                                className="rounded-md object-contain" 
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-muted text-muted-foreground rounded-md">
                                Tidak ada bukti bayar
                            </div>
                        )}
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center gap-2">
                    {order.status === 'disetujui' && (
                         <>
                            <Button size="sm" variant="outline" asChild className="bg-green-500 text-white hover:bg-green-600 hover:text-white border-green-600">
                                <a href={whatsAppInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                    <WhatsAppIcon className="h-4 w-4" />
                                </a>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="default" className='bg-blue-600 hover:bg-blue-700' disabled={isPending}>
                                        {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-2" />}
                                        Selesaikan
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Selesaikan Pesanan Ini?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini akan mengubah status pesanan menjadi "Selesai" dan mengembalikan status mobil dan driver (jika ada) menjadi "Tersedia".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSelesaikanPesanan}>Ya, Selesaikan</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         </>
                    )}
                    {order.status === 'selesai' && (
                        <div className='flex items-center text-sm text-blue-600 font-medium'>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Pesanan Selesai
                        </div>
                    )}
                     {order.status === 'tidak disetujui' && (
                        <div className='flex items-center text-sm text-red-600 font-medium'>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Pesanan Ditolak
                        </div>
                    )}
                    {order.status === 'pending' && (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" size="sm" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                    Verifikasi
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                 <DropdownMenuLabel>Ubah Status Pesanan</DropdownMenuLabel>
                                 <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={order.status || 'pending'} onValueChange={(value) => handleStatusChange(value as OrderStatus)}>
                                    <DropdownMenuRadioItem value="disetujui">Disetujui</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="tidak disetujui">Ditolak</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}


export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const fetchOrderData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        const { data: driverData, error: driverError } = await supabase.from('drivers').select('*');

        if (orderError) {
            toast({ variant: 'destructive', title: 'Gagal mengambil data pesanan', description: orderError.message });
        } else {
            setOrders(orderData || []);
        }

        if (driverError) {
            toast({ variant: 'destructive', title: 'Gagal mengambil data driver', description: driverError.message });
        } else {
            setDrivers(driverData || []);
        }

        setIsLoading(false);
    }
    
    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (supabase) {
            fetchOrderData();
        }
    }, [supabase]);

    const { pendingOrders, approvedOrders, completedOrders } = useMemo(() => {
        return {
            pendingOrders: orders.filter(o => o.status === 'pending'),
            approvedOrders: orders.filter(o => o.status === 'disetujui'),
            completedOrders: orders.filter(o => o.status === 'selesai' || o.status === 'tidak disetujui'),
        }
    }, [orders]);
    
    if (isLoading) {
        return (
            <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                    <h1 className="text-3xl font-bold tracking-tight">List Order</h1>
                    <p className="text-muted-foreground">
                        Kelola order masuk dan status persetujuannya.
                    </p>
                    </div>
                </div>
                <div className="text-center py-16 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memuat data pesanan...</span>
                </div>
            </div>
        )
    }
    
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">List Order</h1>
          <p className="text-muted-foreground">
            Kelola order masuk dan status persetujuannya.
          </p>
        </div>
      </div>
      
       <Tabs defaultValue="incoming">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="incoming">
                Pesanan Masuk
                 {pendingOrders.length > 0 && (
                    <Badge className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">{pendingOrders.length}</Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="on-progress">
                On Progress
                {approvedOrders.length > 0 && (
                     <Badge className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">{approvedOrders.length}</Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="completed">
                Selesai
            </TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="mt-6">
           {pendingOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingOrders.map((order) => (
                   <OrderCard 
                    key={order.id} 
                    order={order}
                    drivers={drivers}
                    onDataChange={fetchOrderData}
                   />
                ))}
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Tidak Ada Pesanan Masuk</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Saat ada pesanan baru dengan status "pending", pesanan tersebut akan muncul di sini.</p>
                </div>
            )}
        </TabsContent>
         <TabsContent value="on-progress" className="mt-6">
           {approvedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedOrders.map((order) => (
                   <OrderCard 
                    key={order.id} 
                    order={order}
                    drivers={drivers}
                    onDataChange={fetchOrderData}
                   />
                ))}
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Tidak Ada Pesanan Aktif</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Pesanan yang telah Anda setujui akan ditampilkan di sini.</p>
                </div>
            )}
        </TabsContent>
         <TabsContent value="completed" className="mt-6">
           {completedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {completedOrders.map((order) => (
                   <OrderCard 
                    key={order.id} 
                    order={order}
                    drivers={drivers}
                    onDataChange={fetchOrderData}
                   />
                ))}
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Belum Ada Pesanan Selesai</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Pesanan yang telah selesai atau ditolak akan muncul di sini.</p>
                </div>
            )}
        </TabsContent>
       </Tabs>
    </div>
  );
}
