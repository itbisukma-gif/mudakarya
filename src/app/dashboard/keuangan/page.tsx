
'use client';

import { useState, ChangeEvent, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order, BankAccount, Vehicle } from "@/lib/types";
import { Download, FileText, Trash2, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { Combobox } from '@/components/ui/combobox';
import { bankList } from '@/lib/bank-data';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { ComboboxItem } from '@/components/ui/combobox';
import logos from '@/lib/logo-urls.json';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceCosts, updateServiceCost, addBankAccount, deleteBankAccount } from './actions';

export const dynamic = 'force-dynamic';

type BankNameKey = keyof typeof logos;

export default function KeuanganPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrices, startPriceSaveTransition] = useTransition();
  const [isSavingAccount, startAccountSaveTransition] = useTransition();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [serviceCosts, setServiceCosts] = useState({ driver: 0, matic: 0, fuel: 0 });
  const [editableCosts, setEditableCosts] = useState({ driver: '0', matic: '0', fuel: '0' });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);


  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
  const [isQrisUploadOpen, setQrisUploadOpen] = useState(false);
  const { toast } = useToast();
  const [isPricesOpen, setIsPricesOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // States for new bank account form
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const fetchFinancialData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data: orderData, error: orderError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orderError) {
        toast({ variant: 'destructive', title: 'Gagal memuat data keuangan', description: orderError.message });
    } else {
        setOrders(orderData || []);
    }
    
    const { data: vehicleData, error: vehicleError } = await supabase.from('vehicles').select('*');
    if (vehicleError) {
      toast({ variant: 'destructive', title: 'Gagal memuat data kendaraan' });
    } else {
      setVehicles(vehicleData || []);
    }

    const { data: costData, error: costError } = await getServiceCosts();
    if(costError) {
        toast({ variant: 'destructive', title: 'Gagal memuat harga layanan', description: costError.message });
    } else if (costData) {
        setServiceCosts(costData as any);
        setEditableCosts({
            driver: String(costData.driver || 0),
            matic: String(costData.matic || 0),
            fuel: String(costData.fuel || 0),
        });
    }
    
    const { data: bankData, error: bankError } = await supabase.from('bank_accounts').select('*');
    if (bankError) {
      toast({ variant: 'destructive', title: 'Gagal memuat rekening bank', description: bankError.message });
    } else {
      setBankAccounts(bankData || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    const supabaseClient = createClient();
    setSupabase(supabaseClient);
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, [supabase]);


  const financialReport = orders.map((order, index) => {
      const vehicle = vehicles.find(v => v.id === order.vehicleId);
      return {
          no: index + 1,
          orderNo: order.id,
          unit: vehicle ? `${vehicle.brand} ${vehicle.name}` : 'N/A',
          service: order.service,
          transmission: order.transmission,
          payment: order.paymentMethod,
          driver: order.driver || "-",
          total: order.total,
          status: order.status
      }
  });

  const handleDownloadXLSX = async () => {
    if (financialReport.length === 0) {
        toast({
            variant: "destructive",
            title: "Tidak Ada Data",
            description: "Laporan tidak dapat diunduh karena tidak ada data keuangan.",
        });
        return;
    }
    const XLSX = await import('xlsx');
    const reportData = financialReport.map(item => ({
        'No.': item.no,
        'No. Order': item.orderNo,
        'Unit Disewa': item.unit,
        'Layanan': item.service,
        'Transmisi': item.transmission,
        'Jenis Pembayaran': item.payment,
        'Driver': item.driver,
        'Total Pemasukan': item.total,
        'Status': item.status === 'disetujui' ? 'Lunas' : item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    
    const objectMaxLength = [] as number[];
    reportData.forEach(data => {
        Object.values(data).forEach((value, i) => {
            const valueStr = value ? value.toString() : '';
            objectMaxLength[i] = objectMaxLength[i] >= valueStr.length ? objectMaxLength[i] : valueStr.length;
        });
    });
    Object.keys(reportData[0]).forEach((header, i) => {
        objectMaxLength[i] = objectMaxLength[i] >= header.length ? objectMaxLength[i] : header.length;
    });

    const wscols = objectMaxLength.map(w => ({ wch: w + 2 }));
    worksheet['!cols'] = wscols;
    
    const date = new Date();
    const month = date.toLocaleString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    const fileName = `laporan_keuangan_${month.toLowerCase()}_${year}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    
    toast({
        title: "Laporan Diunduh",
        description: `File ${fileName} berhasil dibuat.`
    });
  };
  
  const handlePriceInputChange = (field: 'driver' | 'matic' | 'fuel', value: string) => {
    // Allow only numbers and ensure the value is not negative
    const numericValue = value.replace(/[^0-9]/g, '');
    setEditableCosts(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleSavePrices = () => {
    startPriceSaveTransition(async () => {
        const costsToSave = {
            driver: Number(editableCosts.driver) || 0,
            matic: Number(editableCosts.matic) || 0,
            fuel: Number(editableCosts.fuel) || 0,
        };

        const results = await Promise.all([
            updateServiceCost('driver', costsToSave.driver),
            updateServiceCost('matic', costsToSave.matic),
            updateServiceCost('fuel', costsToSave.fuel)
        ]);

        const hasError = results.some(r => r.error);

        if (hasError) {
             toast({
                variant: 'destructive',
                title: "Gagal Menyimpan",
                description: "Sebagian atau semua harga gagal diperbarui. Silakan coba lagi.",
            });
        } else {
             toast({
                title: "Harga Disimpan",
                description: "Harga layanan telah berhasil diperbarui."
            });
            setServiceCosts(costsToSave);
            setIsPricesOpen(false);
        }
    });
  };

  const handleAddAccount = () => {
    startAccountSaveTransition(async () => {
      if (!selectedBank || !accountNumber || !accountName) {
          toast({ variant: 'destructive', title: 'Formulir tidak lengkap' });
          return;
      }
      
      const bankDetails = bankList.find(b => b.value === selectedBank);
      if (!bankDetails) return;

      const newAccount: Omit<BankAccount, 'id' | 'created_at'> = {
          bankName: bankDetails.label,
          accountNumber,
          accountName,
          logoUrl: logos[bankDetails.value as BankNameKey] || ''
      };
      
      const { error } = await addBankAccount(newAccount);

      if (error) {
        toast({ variant: 'destructive', title: 'Gagal Menambah Rekening', description: error.message });
      } else {
        toast({ title: "Rekening Ditambahkan" });
        setSelectedBank("");
        setAccountNumber("");
        setAccountName("");
        fetchFinancialData(); // Refresh data
      }
    });
  };
  
  const handleDeleteAccount = (id: number) => {
    startAccountSaveTransition(async () => {
      const { error } = await deleteBankAccount(id);
       if (error) {
        toast({ variant: "destructive", title: "Gagal Menghapus Rekening", description: error.message });
      } else {
        toast({ variant: "destructive", title: "Rekening Dihapus" });
        fetchFinancialData(); // Refresh data
      }
    });
  }
  
   const handleQrisSave = () => {
      toast({
        title: "QRIS Diperbarui",
        description: `Kode QRIS baru telah berhasil disimpan dan diaktifkan.`
    })
    setQrisUploadOpen(false)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setPreviewUrl(URL.createObjectURL(file));
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keuangan</h1>
          <p className="text-muted-foreground">
            Kelola harga, metode pembayaran, dan laporan keuangan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isPricesOpen} onOpenChange={setIsPricesOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">Harga Layanan</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pengaturan Harga Layanan</DialogTitle>
                        <DialogDescription>
                            Atur biaya tambahan untuk layanan per hari.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="driver-price" className="text-right">Harga Supir</Label>
                            <Input 
                                id="driver-price" 
                                type="text"
                                value={editableCosts.driver} 
                                onChange={(e) => handlePriceInputChange('driver', e.target.value)}
                                className="col-span-2" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="matic-price" className="text-right">Biaya Matic</Label>
                             <Input 
                                id="matic-price" 
                                type="text"
                                value={editableCosts.matic} 
                                onChange={(e) => handlePriceInputChange('matic', e.target.value)}
                                className="col-span-2" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="fuel-price" className="text-right">Harga BBM</Label>
                             <Input 
                                id="fuel-price" 
                                type="text"
                                value={editableCosts.fuel} 
                                onChange={(e) => handlePriceInputChange('fuel', e.target.value)}
                                className="col-span-2"
                             />
                        </div>
                        <p className='text-xs text-muted-foreground text-center pt-2'>Harga BBM hanya akan ditambahkan untuk layanan "All Include".</p>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSavePrices} disabled={isSavingPrices}>
                            {isSavingPrices && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Harga
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full">Jenis Pembayaran</Button>
                </DialogTrigger>
                 <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Pengaturan Jenis Pembayaran</DialogTitle>
                         <DialogDescription>
                            Kelola rekening bank dan kode QRIS untuk menerima pembayaran.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="bank">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="bank">Transfer Bank</TabsTrigger>
                            <TabsTrigger value="qris">QRIS</TabsTrigger>
                        </TabsList>
                        <TabsContent value="bank" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tambah Rekening</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Combobox
                                            items={bankList as ComboboxItem[]}
                                            searchPlaceholder="Cari bank..."
                                            placeholder="Pilih Bank"
                                            notfoundText="Bank tidak ditemukan."
                                            onSelect={setSelectedBank}
                                        />
                                        <Input placeholder="Nomor Rekening" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                                        <Input placeholder="Atas Nama" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                                    </div>
                                    <Button onClick={handleAddAccount} disabled={isSavingAccount}>
                                      {isSavingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Tambah Rekening
                                    </Button>
                                    <div className="space-y-4 pt-6">
                                        <h4 className="font-medium text-lg">Daftar Rekening</h4>
                                        {bankAccounts.length > 0 ? bankAccounts.map(acc => (
                                            <div key={acc.id} className="rounded-md border p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                <div className="relative h-8 w-12">
                                                    <Image src={acc.logoUrl} alt={`${acc.bankName} logo`} fill className="object-contain" />
                                                </div>
                                                <div>
                                                        <p className="font-semibold text-base">{acc.bankName} - {acc.accountNumber}</p>
                                                        <p className="text-sm text-muted-foreground">a.n. {acc.accountName}</p>
                                                </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isSavingAccount}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tindakan ini akan menghapus rekening {acc.bankName} a.n. {acc.accountName} secara permanen.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteAccount(acc.id!)} disabled={isSavingAccount} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )) : (
                                             <p className="text-sm text-muted-foreground text-center py-4">Belum ada rekening bank yang ditambahkan.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="qris" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kelola Kode QRIS</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <Dialog open={isQrisUploadOpen} onOpenChange={setQrisUploadOpen}>
                                        <DialogTrigger asChild>
                                             <Button variant="outline">Upload Kode QR Baru</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Upload Kode QRIS</DialogTitle>
                                                <DialogDescription>
                                                    Unggah gambar kode QRIS baru untuk menggantikan yang lama.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                 {previewUrl && (
                                                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-md overflow-hidden border">
                                                        <Image
                                                            src={previewUrl}
                                                            alt="Pratinjau QRIS"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                )}
                                                <Label htmlFor="qris-upload" className={cn("w-full cursor-pointer", "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", "border border-input bg-background hover:bg-accent hover:text-accent-foreground", "h-10 px-4 py-2")}>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {previewUrl ? 'Ganti File...' : 'Pilih File Gambar QRIS...'}
                                                </Label>
                                                <Input id="qris-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setQrisUploadOpen(false)}>Batal</Button>
                                                <Button onClick={handleQrisSave} disabled={!previewUrl}>Upload &amp; Simpan</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                     </Dialog>
                                    
                                    <div className="space-y-4 pt-6">
                                        <h4 className="font-medium text-lg">QRIS Aktif</h4>
                                        <div className="relative w-48 h-48 border rounded-md p-2">
                                            <Image src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example" alt="QRIS Code" fill className="object-contain" data-ai-hint="qr code"/>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full"><Trash2 className="h-4 w-4"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Hapus QRIS Aktif?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tindakan ini akan menonaktifkan pembayaran melalui QRIS hingga Anda mengunggah kode yang baru.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
      </div>

       <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle>Laporan Keuangan</CardTitle>
                <CardDescription>Ringkasan transaksi berdasarkan data order.</CardDescription>
            </div>
            <Button variant="outline" className="w-full md:w-auto" onClick={handleDownloadXLSX} disabled={financialReport.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download Laporan (XLSX)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>No. Order</TableHead>
                <TableHead>Unit Disewa</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Jenis Pembayaran</TableHead>
                <TableHead>Total Pemasukan</TableHead>
                <TableHead className="text-center">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                       <div className="flex justify-center items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Memuat laporan...</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : financialReport.length > 0 ? (
                financialReport.map((item) => (
                    <TableRow key={item.no}>
                    <TableCell>{item.no}</TableCell>
                    <TableCell>{item.orderNo}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.service}</TableCell>
                    <TableCell>{item.payment}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.total || 0)}</TableCell>
                    <TableCell className="text-center">
                        <Button variant="outline" size="sm" asChild disabled={item.status !== 'disetujui'}>
                        <Link href={`/invoice/${item.orderNo}`} target="_blank">
                            <FileText className="h-4 w-4" />
                        </Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        Belum ada data keuangan.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
