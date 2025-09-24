
'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useTransition } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Car,
  ClipboardList,
  DollarSign,
  MoreHorizontal,
  User,
  Clock,
  CheckCircle,
  UserCheck,
  PlusCircle,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orders as initialOrders } from '@/lib/data' // Keep dummy chart data
import type { Driver, Vehicle, Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { addDays, format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/utils/supabase/client';
import { upsertDriver, deleteDriver, updateDriverStatus } from './actions'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

// Function to generate mock data for comparison
const generatePreviousWeekData = (baseData: typeof initialChartData) => {
    return baseData.map(dayData => ({
        ...dayData,
        revenue: Math.floor(dayData.revenue * (Math.random() * 0.4 + 0.7)) // 70% to 110% of current week's revenue
    }));
};

const initialChartData = [
  { date: 'Sen', revenue: 2100000 },
  { date: 'Sel', revenue: 2500000 },
  { date: 'Rab', revenue: 1800000 },
  { date: 'Kam', revenue: 3200000 },
  { date: 'Jum', revenue: 4100000 },
  { date: 'Sab', revenue: 5300000 },
  { date: 'Min', revenue: 4800000 },
];

const previousWeekData = generatePreviousWeekData(initialChartData);

const combinedChartData = initialChartData.map((current, index) => ({
    name: current.date,
    "Pendapatan Minggu Ini": current.revenue,
    "Pendapatan Minggu Lalu": previousWeekData[index].revenue
}));


function DriverForm({ driver, onSave, onCancel }: { driver?: Driver | null; onSave: () => void; onCancel: () => void; }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(driver?.name || '');
    const [address, setAddress] = useState(driver?.address || '');
    const [phone, setPhone] = useState(driver?.phone || '');

    const handleSave = () => {
        startTransition(async () => {
            const driverData: Omit<Driver, 'created_at'> = {
                id: driver?.id || crypto.randomUUID(), // Use existing ID or generate a new one for insert
                name,
                address,
                phone,
                status: driver?.status || 'Tersedia',
            };
    
            const result = await upsertDriver(driverData);

            if (result.error) {
                 toast({
                    variant: "destructive",
                    title: "Gagal Menyimpan",
                    description: result.error.message,
                });
            } else {
                 toast({
                    title: driver ? "Driver Diperbarui" : "Driver Ditambahkan",
                    description: `Data untuk ${result.data?.name} telah disimpan.`,
                });
                onSave();
            }
        });
    };

    return (
        <>
            <div className="max-h-[70vh] overflow-y-auto px-1 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 px-6">
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label htmlFor="name">Nama Driver</Label>
                        <Input id="name" placeholder="cth. Budi Santoso" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label htmlFor="address">Alamat</Label>
                        <Input id="address" placeholder="cth. Jl. Merdeka No. 10, Jakarta" value={address || ''} onChange={(e) => setAddress(e.target.value)} disabled={isPending}/>
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label htmlFor="phone">Nomor WhatsApp</Label>
                        <Input id="phone" type="tel" placeholder="cth. 081234567890" value={phone || ''} onChange={(e) => setPhone(e.target.value)} disabled={isPending} />
                    </div>
                </div>
            </div>
             <DialogFooter className="pt-4 border-t px-6 pb-6 bg-background rounded-b-lg">
                <Button variant="outline" onClick={onCancel} disabled={isPending}>Batal</Button>
                <Button type="submit" onClick={handleSave} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isPending ? 'Menyimpan...' : (driver ? 'Simpan Perubahan' : 'Simpan Driver')}
                </Button>
            </DialogFooter>
        </>
    )
}


export default function DashboardPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const { toast } = useToast();
  const [isProcessing, startTransition] = useTransition();

   const fetchData = React.useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data: driverData, error: driverError } = await supabase.from('drivers').select('*').order('created_at', { ascending: false });
        const { data: vehicleData, error: vehicleError } = await supabase.from('vehicles').select('*');
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*');

        if (driverError) {
             toast({ variant: "destructive", title: "Gagal memuat driver", description: driverError.message });
        } else {
             setDrivers(driverData || []);
        }

        if (vehicleError) {
             toast({ variant: "destructive", title: "Gagal memuat armada", description: vehicleError.message });
        } else {
            setFleet(vehicleData || []);
        }
        
        if (orderError) {
             toast({ variant: "destructive", title: "Gagal memuat order", description: orderError.message });
        } else {
            setOrders(orderData || []);
        }
        
        setIsLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
      const supabaseClient = createClient();
      setSupabase(supabaseClient);
      setDate({
        from: new Date(),
        to: addDays(new Date(), 6),
      });
    }, []);
  
    useEffect(() => {
        if(supabase) {
            fetchData();
        }
    }, [supabase, fetchData]);
  
  const stats = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const availableDrivers = drivers.filter(d => d.status === 'Tersedia').length;
    
    const availableUnits = fleet.filter(v => v.status === 'tersedia').length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const completedThisMonth = orders.filter(o => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        return o.status === 'selesai' && orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    }).length;

    return { pendingOrders, availableDrivers, availableUnits, completedThisMonth };
  }, [orders, drivers, fleet]);


  const handleEditClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setEditDialogOpen(true);
  };
  
  const handleDeleteDriver = (driverId: string) => {
    startTransition(async () => {
        const result = await deleteDriver(driverId);
        if (result.error) {
            toast({ variant: "destructive", title: "Gagal Menghapus", description: result.error.message });
        } else {
            toast({ title: "Driver Dihapus", description: `Data driver telah berhasil dihapus.` });
            fetchData();
        }
    });
  }

  const handleStatusChange = (driverId: string, newStatus: 'Tersedia' | 'Bertugas') => {
    startTransition(async () => {
        const result = await updateDriverStatus(driverId, newStatus);
        if (result.error) {
            toast({ variant: "destructive", title: "Gagal Memperbarui Status", description: result.error.message });
        } else {
            toast({ title: "Status Diperbarui", description: `Status driver telah berhasil diperbarui.` });
            fetchData();
        }
    });
  };
  
  const handleFormSave = () => {
    fetchData();
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedDriver(null);
  };
  
  const handleFormCancel = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedDriver(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const weeklyRev = payload.find((p: any) => p.dataKey === 'Pendapatan Minggu Ini');
        const lastWeekRev = payload.find((p: any) => p.dataKey === 'Pendapatan Minggu Lalu');

        return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                Minggu Ini
                </span>
                <span className="font-bold text-blue-600">
                 {weeklyRev ? formatCurrency(weeklyRev.value) : 'N/A'}
                </span>
            </div>
            <div className="flex flex-col space-y-1">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                Minggu Lalu
                </span>
                <span className="font-bold text-gray-500">
                {lastWeekRev ? formatCurrency(lastWeekRev.value) : 'N/A'}
                </span>
            </div>
            </div>
        </div>
        );
    }

    return null;
 };

  return (
    <div className="flex flex-col gap-8">
       <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <Card className="xl:col-span-3">
                <CardHeader className="flex flex-col items-baseline justify-between gap-4 sm:flex-row">
                    <div>
                        <CardTitle>Analisis Pendapatan</CardTitle>
                        <CardDescription>Perbandingan pendapatan minggu ini dan minggu lalu.</CardDescription>
                    </div>
                     <div className={cn("grid gap-2")}>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-[300px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pilih tanggal</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={combinedChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${formatCurrency(value as number)}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            <Line type="monotone" dataKey="Pendapatan Minggu Ini" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                            <Line type="monotone" dataKey="Pendapatan Minggu Lalu" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>Statistik Operasional</CardTitle>
                    <CardDescription>Ringkasan status operasional terkini.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-yellow-700">
                                <Clock className="h-4 w-4" />
                                Order Pending
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-yellow-800">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingOrders}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-green-700">
                                <UserCheck className="h-4 w-4" />
                            Driver Tersedia
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-800">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.availableDrivers}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-blue-700">
                                <Car className="h-4 w-4" />
                                Unit Siap Jalan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-3xl font-bold text-blue-800">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.availableUnits}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-200">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-gray-700">
                                <CheckCircle className="h-4 w-4" />
                            Order Selesai (Bulan Ini)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-gray-800">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.completedThisMonth}</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
       </div>

      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
            <div>
              <CardTitle>Manajemen Driver</CardTitle>
              <CardDescription>
                Kelola data dan ketersediaan driver.
              </CardDescription>
            </div>
             <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setSelectedDriver(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Driver Baru
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Tambahkan Driver Baru</DialogTitle>
                        <DialogDescription>Isi detail driver baru di bawah ini.</DialogDescription>
                    </DialogHeader>
                    <DriverForm onSave={handleFormSave} onCancel={handleFormCancel} />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Nomor WhatsApp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Memuat data driver...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : drivers.length > 0 ? (
                    drivers.map((driver) => (
                    <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell>
                        <Select value={driver.status} onValueChange={(value: 'Tersedia' | 'Bertugas') => handleStatusChange(driver.id, value)} disabled={isProcessing}>
                            <SelectTrigger className={cn("w-[130px] capitalize", 
                                driver.status === 'Tersedia' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            )}>
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tersedia">Tersedia</SelectItem>
                                <SelectItem value="Bertugas">Bertugas</SelectItem>
                            </SelectContent>
                        </Select>
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isProcessing}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleEditClick(driver)}>Edit</DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className='text-destructive' onSelect={(e) => e.preventDefault()}>Hapus</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini akan menghapus data driver <span className="font-bold">{driver.name}</span> secara permanen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteDriver(driver.id)} className="bg-destructive hover:bg-destructive/90">
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Ya, Hapus
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Belum ada driver yang ditambahkan.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
         <DialogContent className="sm:max-w-xl p-0">
            <DialogHeader className="p-6 pb-0">
                <DialogTitle>Edit Driver</DialogTitle>
                <DialogDescription>Perbarui detail driver di bawah ini.</DialogDescription>
            </DialogHeader>
            <DriverForm driver={selectedDriver} onSave={handleFormSave} onCancel={handleFormCancel} />
        </DialogContent>
       </Dialog>
      
    </div>
  )
}
