

'use client';

import { useState, useMemo, useEffect, useTransition, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Send, Eye, Share, CheckCircle, Car, ShieldCheck, Clock, AlertTriangle, Loader2, Users, Calendar } from "lucide-react";
import Link from "next/link";
import type { Driver, Order, OrderStatus, Vehicle } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDistanceToNow, differenceInHours, isToday, isPast } from 'date-fns';
import { id } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';
import { updateDriverStatus } from '../actions';
import { updateVehicleStatus, adjustVehicleStock } from '../armada/actions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WhatsAppIcon } from '@/components/icons';
import { updateOrderDriver, updateOrderStatus } from './actions';


const getStatusInfo = (status: OrderStatus | null) => {
    switch (status) {
        case 'disetujui':
            return { label: 'Disetujui', className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' };
        case 'pending':
            return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100' };
        case 'dipesan':
            return { label: 'Dipesan', className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100' };
        case 'tidak disetujui':
            return { label: 'Ditolak', className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100' };
        case 'selesai':
            return { label: 'Selesai', className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100' };
        default:
            return { label: 'Unknown', className: 'bg-secondary text-secondary-foreground hover:bg-secondary' };
    }
}

function OrderCard({ order, drivers, vehicle, onDataChange }: { order: Order, drivers: Driver[], vehicle: Vehicle | undefined, onDataChange: () => void }) {
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
            const oldStatus = order.status;
            
            const { error: orderError } = await updateOrderStatus(order.id, newStatus);
            if (orderError) {
                toast({ variant: 'destructive', title: 'Gagal Memperbarui Status', description: (orderError as Error).message });
                return;
            }

            // Handle Vehicle Status and Stock Changes
            if (vehicle) {
                if (newStatus === 'disetujui') {
                    await updateVehicleStatus(vehicle.id, 'disewa');
                } else if ((newStatus === 'tidak disetujui' || newStatus === 'selesai') && (oldStatus === 'disetujui' || oldStatus === 'dipesan')) {
                     if (vehicle.unitType === 'khusus') {
                        // For special units, incrementing stock is the way to make it available again
                        await adjustVehicleStock(vehicle.id, 1);
                    }
                    await updateVehicleStatus(vehicle.id, 'tersedia');
                }
            }

            
            // Handle Driver Status
            if ((newStatus === 'tidak disetujui' || newStatus === 'selesai') && order.driverId) {
                await updateDriverStatus(order.driverId, 'Tersedia');
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
                const { error: oldDriverError } = await updateDriverStatus(order.driverId, 'Tersedia');
                 if (oldDriverError) {
                    toast({ variant: 'destructive', title: 'Gagal Melepas Driver Lama', description: (oldDriverError as Error).message });
                 }
            }

            const { error: orderError } = await updateOrderDriver(order.id, driverName, driverId);
            if (orderError) {
                toast({ variant: 'destructive', title: 'Gagal Menugaskan Driver', description: (orderError as Error).message });
                return;
            }

            // Don't change driver status here, let the driver accept the job first
            toast({ title: "Driver Dipilih", description: `${driverName} telah dipilih untuk pesanan ${order.id}. Kirim penugasan sekarang.` });

            onDataChange();
        });
    };
    
    const handleSelesaikanPesanan = () => {
        handleStatusChange('selesai');
    };

    const selectedDriver = useMemo(() => {
        return drivers.find(d => d.id === order.driverId);
    }, [drivers, order.driverId]);

    const whatsAppAssignmentUrl = useMemo(() => {
        if (!selectedDriver?.phone || typeof window === 'undefined' || !vehicle) return '#';

        const domain = window.location.origin;
        const assignmentUrl = `${domain}/penugasan/${order.id}`;
        
        const message = `Halo ${selectedDriver.name}, Anda mendapatkan penugasan baru dari MudaKarya RentCar.
Customer: ${order.customerName}
Mobil: ${vehicle.brand} ${vehicle.name}
Layanan: ${order.service}

Silakan buka tautan berikut untuk menerima atau menolak penugasan:
${assignmentUrl}`;
        
        let formattedPhone = selectedDriver.phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('62')) {
            formattedPhone = '62' + formattedPhone;
        }

        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }, [order, vehicle, selectedDriver]);

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
                {vehicle && (
                  <div className="flex items-center gap-2 pt-3 text-sm text-muted-foreground">
                      <Car className="h-4 w-4" />
                      <span>{vehicle.brand} {vehicle.name}</span>
                  </div>
                )}
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
                 {order.isPartnerUnit && vehicle && (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 [&>svg]:text-blue-600">
                        <Users className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Unit Mitra Diperlukan</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Pesanan ini perlu dipenuhi dari unit mitra: <span className="font-bold">{vehicle.brand} {vehicle.name}</span>.
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
                            <div className="flex items-center gap-2">
                                <Select 
                                    value={order.driverId ? `${order.driverId}|${order.driver}` : undefined} 
                                    onValueChange={handleDriverChange}
                                    disabled={order.status !== 'pending' && order.status !== 'dipesan' || isPending}
                                >
                                    <SelectTrigger className="w-[150px] h-8 text-xs">
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
                                {(order.status === 'pending' || order.status === 'dipesan') && selectedDriver && (
                                    <Button size="sm" variant="outline" asChild className="h-8 w-8 p-0 bg-green-500 text-white hover:bg-green-600 hover:text-white border-green-600">
                                        <a href={whatsAppAssignmentUrl} target="_blank" rel="noopener noreferrer">
                                            <WhatsAppIcon className="h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                             </div>
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
                         <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start">
                            <Eye className="h-4 w-4 mr-2" />
                            Bukti Bayar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-0">
                        <DialogHeader className='p-6 pb-4'>
                            <DialogTitle>Bukti Pembayaran</DialogTitle>
                            <DialogDescription>
                                Order ID: {order.id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-0 aspect-video w-full p-6 pt-0">
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
                    {(order.status === 'pending' || order.status === 'dipesan') && (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" size="sm" disabled={isPending || (requiresDriver && order.status === 'pending' && !order.driverId)}>
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
                     {requiresDriver && order.status === 'pending' && !order.driverId && (
                        <p className="text-xs text-muted-foreground text-right">Pilih driver terlebih dahulu</p>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}


export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);


    const fetchOrderData = useCallback(async (supabaseClient: SupabaseClient) => {
        setIsLoading(true);
        
        // --- Automatic Status Update Logic ---
        // Fetch reservations that need to be activated
        const today = new Date().toISOString().split('T')[0];
        const { data: dueReservations, error: dueResError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('status', 'dipesan')
            .lte('reservations.startDate', today); // This seems to be pseudo-code, Supabase doesn't join like this in JS client.
            // A server-side function would be better, but for now we process client-side.
            
        const { data: allReservations, error: allResError } = await supabaseClient.from('reservations').select('orderId, startDate');

        if (!allResError) {
            const ordersToActivate = allReservations
                .filter(res => (isToday(new Date(res.startDate)) || isPast(new Date(res.startDate))))
                .map(res => res.orderId);
            
            const { data: ordersDataToActivate } = await supabaseClient
                .from('orders')
                .select('id, status')
                .in('id', ordersToActivate)
                .eq('status', 'dipesan');
            
            if (ordersDataToActivate && ordersDataToActivate.length > 0) {
                const activationPromises = ordersDataToActivate.map(order => updateOrderStatus(order.id, 'disetujui'));
                await Promise.all(activationPromises);
                toast({ title: 'Status Otomatis', description: `${ordersDataToActivate.length} reservasi telah otomatis masuk ke "On Progress".`});
            }
        }
        // --- End of Automatic Status Update Logic ---


        const [orderRes, driverRes, vehicleRes] = await Promise.all([
            supabaseClient.from('orders').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('drivers').select('*'),
            supabaseClient.from('vehicles').select('*')
        ]);

        const { data: orderData, error: orderError } = orderRes;
        if (orderError) toast({ variant: 'destructive', title: 'Gagal mengambil data pesanan', description: orderError.message });
        else setOrders(orderData || []);
        
        const { data: driverData, error: driverError } = driverRes;
        if (driverError) toast({ variant: 'destructive', title: 'Gagal mengambil data driver', description: driverError.message });
        else setDrivers(driverData || []);

        const { data: vehicleData, error: vehicleError } = vehicleRes;
        if (vehicleError) toast({ variant: 'destructive', title: 'Gagal mengambil data kendaraan', description: vehicleError.message });
        else setVehicles(vehicleData || []);

        setIsLoading(false);
    }, [toast])
    
    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
         if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }
    }, []);

    useEffect(() => {
        if (supabase) {
            fetchOrderData(supabase);
        }
    }, [supabase, fetchOrderData]);
    
     useEffect(() => {
        if (!supabase) return;

        const channel = supabase.channel('realtime-orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                const newOrder = payload.new as Order;
                setOrders(prevOrders => [newOrder, ...prevOrders]);
                
                // Play notification sound
                audioRef.current?.play().catch(e => console.error("Error playing sound:", e));
                
                // Show toast notification
                toast({
                    title: "Pesanan Baru Masuk!",
                    description: `Pesanan dari ${newOrder.customerName} (ID: ${newOrder.id}) telah diterima.`,
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, toast]);


    const { pendingOrders, reservedOrders, approvedOrders, completedOrders } = useMemo(() => {
        return {
            pendingOrders: orders.filter(o => o.status === 'pending'),
            reservedOrders: orders.filter(o => o.status === 'dipesan'),
            approvedOrders: orders.filter(o => o.status === 'disetujui'),
            completedOrders: orders.filter(o => o.status === 'selesai' || o.status === 'tidak disetujui'),
        }
    }, [orders]);
    
    const ordersWithVehicles = useMemo(() => {
        return orders.map(order => {
            const vehicle = vehicles.find(v => v.id === order.vehicleId);
            return { order, vehicle };
        })
    }, [orders, vehicles]);

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
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="incoming">
                Pesanan Masuk
                 {pendingOrders.length > 0 && (
                    <Badge className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">{pendingOrders.length}</Badge>
                )}
            </TabsTrigger>
             <TabsTrigger value="reserved">
                Reservasi
                 {reservedOrders.length > 0 && (
                    <Badge className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">{reservedOrders.length}</Badge>
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
                    vehicle={vehicles.find(v => v.id === order.vehicleId)}
                    onDataChange={() => supabase && fetchOrderData(supabase)}
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
         <TabsContent value="reserved" className="mt-6">
           {reservedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {reservedOrders.map((order) => (
                   <OrderCard 
                    key={order.id} 
                    order={order}
                    drivers={drivers}
                    vehicle={vehicles.find(v => v.id === order.vehicleId)}
                    onDataChange={() => supabase && fetchOrderData(supabase)}
                   />
                ))}
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Tidak Ada Reservasi</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Pesanan untuk tanggal mendatang akan ditampilkan di sini.</p>
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
                    vehicle={vehicles.find(v => v.id === order.vehicleId)}
                    onDataChange={() => supabase && fetchOrderData(supabase)}
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
                    vehicle={vehicles.find(v => v.id === order.vehicleId)}
                    onDataChange={() => supabase && fetchOrderData(supabase)}
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

  

    
