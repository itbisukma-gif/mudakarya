

'use client'

import { Suspense, useEffect, useState, ChangeEvent, useMemo } from "react";
import { useSearchParams, notFound, useRouter } from 'next/navigation'
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Loader2, ClipboardCopy, Paperclip, AlertCircle, ArrowLeft, FileCheck, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format, parseISO, startOfDay, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { useLanguage } from "@/hooks/use-language";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BankAccount, Order, Vehicle, Driver, Reservation } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppIcon } from "@/components/icons";
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateVehicleStatus } from "@/app/dashboard/armada/actions";
import { createSignedUploadUrl } from "@/app/actions/upload-actions";
import { incrementBookedCount } from "@/app/actions/vehicle-stats";
import { checkVehicleAvailability } from "@/app/actions/reservation-actions";

async function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function BankAccountDetails({ bank }: { bank: BankAccount }) {
    const { dictionary } = useLanguage();
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(bank.accountNumber);
        setCopied(true);
        toast({
            title: "Berhasil Disalin",
            description: "Nomor rekening telah disalin ke clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
         <div className="flex justify-between items-center p-4 bg-muted/50 rounded-md mt-4 border">
            <div className="flex items-center gap-4">
                 <div className="relative h-8 w-12">
                    <Image src={bank.logoUrl} alt={`${bank.bankName} logo`} fill className="object-contain" />
                 </div>
                 <div>
                    <p className="font-semibold">{bank.bankName}</p>
                    <p className="font-mono text-base">{bank.accountNumber}</p>
                    <p className="text-sm text-muted-foreground">a.n. {bank.accountName}</p>
                </div>
            </div>
             <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-primary px-3 py-1.5"
            >
                <ClipboardCopy className="h-4 w-4 mr-2" />
                {copied ? dictionary.confirmation.copied : dictionary.confirmation.copy}
            </button>
        </div>
    );
}

function UploadProof({ onUpload, orderId, isBankTransfer, isBankSelected }: { onUpload: (proofUrl: string) => void, orderId: string, isBankTransfer: boolean, isBankSelected: boolean }) {
    const { dictionary } = useLanguage();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { toast } = useToast();
    const supabase = createClient();

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
             if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({
                    variant: 'destructive',
                    title: 'Ukuran File Terlalu Besar',
                    description: 'Ukuran file tidak boleh melebihi 4MB.',
                });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setUploadState('idle');
            setErrorMessage('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setUploadState('uploading');
        setErrorMessage('');

        try {
            const fileExtension = selectedFile.name.split('.').pop();
            const fileName = `${orderId}-${Date.now()}.${fileExtension}`;
            const filePath = `public/proofs/${fileName}`;

            // 1. Get a signed upload URL from the server
            const { signedUrl, token, error: urlError } = await createSignedUploadUrl(filePath);

            if (urlError) {
                throw new Error(`Gagal membuat URL unggah: ${urlError.message}`);
            }

            // 2. Upload the file directly to Supabase Storage from the client
            const { error: uploadError } = await supabase.storage
                .from('mudakarya-bucket')
                .uploadToSignedUrl(filePath, token, selectedFile);
            
            if (uploadError) {
                throw new Error(`Gagal mengunggah file: ${uploadError.message}`);
            }
            
            // 3. Get the public URL of the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('mudakarya-bucket')
                .getPublicUrl(filePath);

            if (!publicUrl) {
                throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
            }

            setUploadState('success');
            onUpload(publicUrl); 

        } catch (error) {
            console.error("[HANDLE_UPLOAD_ERROR] Terjadi error saat meng-upload file:", error);
            const message = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
            setErrorMessage(message);
            setUploadState('error');
        }
    };

    const isSubmitDisabled = !selectedFile || uploadState === 'uploading' || !orderId || (isBankTransfer && !isBankSelected);
    
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>{dictionary.confirmation.upload.title}</CardTitle>
                <CardDescription>
                    {dictionary.confirmation.upload.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 
                 {uploadState === 'error' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{dictionary.confirmation.upload.error.title}</AlertTitle>
                        <AlertDescription>
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                 )}

                <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="proof-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Pilih File
                    </Label>
                    <Button onClick={handleUpload} disabled={isSubmitDisabled} className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">
                        {uploadState === 'uploading' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {dictionary.confirmation.upload.uploading}
                            </>
                        ) : dictionary.confirmation.upload.submit}
                    </Button>
                </div>
                 {isBankTransfer && !isBankSelected && (
                    <p className="text-xs text-destructive mt-2">
                        Silakan pilih bank tujuan terlebih dahulu sebelum mengirim bukti pembayaran.
                    </p>
                )}
                <Input
                    id="proof-upload"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg"
                    className="hidden"
                />

                {previewUrl && selectedFile && (
                    <div className="mt-4 border rounded-md p-3">
                        <p className="text-sm font-medium mb-2">{dictionary.confirmation.upload.preview}</p>
                         <div className="relative aspect-3/2 w-full mx-auto">
                           <Image
                                src={previewUrl}
                                alt={`${dictionary.confirmation.upload.preview} ${selectedFile.name}`}
                                fill
                                className="rounded-md object-contain"
                            />
                         </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">{selectedFile.name}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function KonfirmasiComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    
    const paymentMethod = searchParams.get('paymentMethod');
    const total = searchParams.get('total');
    const vehicleId = searchParams.get('vehicleId');
    const service = searchParams.get('service');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const discount = searchParams.get('discount');
    const maticFee = searchParams.get('maticFee');
    const customerName = searchParams.get('name');
    const customerPhone = searchParams.get('phone');
    const driverId = searchParams.get('driverId');
    
    const { dictionary } = useLanguage();

    const showDriverContact = driver && (service === 'dengan-supir' || service === 'all-include');

    const [orderId, setOrderId] = useState('');
    const [selectedBankId, setSelectedBankId] = useState<string | undefined>(undefined);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    const selectedBank = useMemo(() => {
        return bankAccounts.find(bank => bank.accountNumber === selectedBankId);
    }, [selectedBankId, bankAccounts]);
    
    const formattedRentalPeriod = useMemo(() => {
        if (startDateStr && endDateStr) {
            try {
                // The date strings are in UTC (ISO format), so parse them as such
                const start = parseISO(startDateStr);
                const end = parseISO(endDateStr);

                // Format them for display in the local (Indonesian) time
                const locale = id;
                return `${format(start, 'd LLL yy', { locale })} - ${format(end, 'd LLL yy', { locale })}`;
            } catch (error) {
                console.error("Error parsing date strings:", error);
                return dictionary.confirmation.invalidPeriod;
            }
        }
        const days = searchParams.get('days') || '1';
        return `${days} ${dictionary.confirmation.days}`;
    }, [startDateStr, endDateStr, searchParams, dictionary]);

    
    const invoiceUrl = useMemo(() => {
        let url = `/invoice/${orderId}/share`;
        const params = new URLSearchParams();
        if (startDateStr) params.append('startDate', startDateStr);
        if (endDateStr) params.append('endDate', endDateStr);
        if (searchParams.get('days')) params.append('days', searchParams.get('days')!);
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
    }, [orderId, startDateStr, endDateStr, searchParams]);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
        const randomOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
        setOrderId(randomOrderId);

        const fetchBankAccounts = async () => {
            const { data, error } = await supabaseClient.from('bank_accounts').select('*');
            if (error) {
                toast({ variant: 'destructive', title: 'Gagal memuat rekening bank' });
            } else {
                setBankAccounts(data || []);
            }
        };
        fetchBankAccounts();
    }, [toast]);

    useEffect(() => {
        if (!supabase || !vehicleId) return;
        
        const fetchVehicleAndDriver = async () => {
            const { data: vehicleData } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
            setVehicle(vehicleData);
            
            if (driverId) {
                 const { data: driverData } = await supabase.from('drivers').select('*').eq('id', driverId).single();
                 setDriver(driverData);
            }
        };
        fetchVehicleAndDriver();
    }, [vehicleId, driverId, supabase]);

    const handleUploadSuccess = async (proofUrl: string) => {
        if (!supabase || !vehicleId || !vehicle || isSavingOrder) return;
        setIsSavingOrder(true);

        try {
            // Determine the order status based on whether it's a reservation or a direct booking
            const isReservation = startDateStr && !isToday(startOfDay(parseISO(startDateStr)));
            const orderStatus = isReservation ? 'dipesan' : 'pending';

            // Check if this booking will create a double-booking for a regular unit.
            let isPartnerUnitNeeded = vehicle.unitType === 'khusus';
            if (vehicle.unitType === 'biasa' && startDateStr && endDateStr) {
                const { data: isAvailable } = await checkVehicleAvailability(vehicle.id, startDateStr, endDateStr);
                // If it's NOT available, it means we have a double book, so we need a partner unit.
                if (isAvailable === false) {
                    isPartnerUnitNeeded = true;
                }
            }


            // 1. Create the new order
            const newOrder: Omit<Order, 'created_at'> = {
                id: orderId,
                customerName: customerName,
                customerPhone: customerPhone,
                type: vehicle.type,
                fuel: vehicle.fuel,
                transmission: vehicle.transmission,
                service: service?.replace('-', ' ') || null,
                driver: driver ? driver.name : null,
                driverId: driverId,
                vehicleId: vehicleId,
                paymentProof: proofUrl,
                status: orderStatus,
                paymentMethod: paymentMethod === 'bank' ? 'Transfer Bank' : 'QRIS',
                total: Number(total),
                isPartnerUnit: isPartnerUnitNeeded
            };

            const { error: insertError } = await supabase.from('orders').insert(newOrder);

            if (insertError) {
                throw new Error(insertError.message);
            }

            // 2. Create a reservation entry if start and end dates are provided
            if (startDateStr && endDateStr) {
                const newReservation: Reservation = {
                    vehicleId: vehicleId,
                    orderId: orderId,
                    startDate: startDateStr,
                    endDate: endDateStr,
                    created_at: new Date().toISOString()
                };
                const { error: reservationError } = await supabase.from('reservations').insert(newReservation);
                if (reservationError) {
                    // If creating reservation fails, we should ideally roll back the order creation.
                    // For now, we'll log the error and notify the user.
                    console.error('Failed to create reservation entry:', reservationError);
                    throw new Error('Gagal menyimpan jadwal reservasi. ' + reservationError.message);
                }
            }
            
            // For direct bookings of special units, adjust stock immediately
            if (vehicle.unitType === 'khusus' && !isReservation) {
                await updateVehicleStatus(vehicleId, 'dipesan');
            }


            // 3. Increment booked count (fire-and-forget)
            await incrementBookedCount(vehicle.id);

            setUploadSuccess(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan pesanan.";
             toast({ variant: 'destructive', title: 'Gagal Membuat Pesanan', description: errorMessage });
        } finally {
            setIsSavingOrder(false);
        }
    };

    if (!vehicleId || !total || !service || !paymentMethod || !customerName || !customerPhone) {
        return (
             <div className="container mx-auto max-w-lg py-8 md:py-12 px-4">
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{dictionary.confirmation.error.title}</AlertTitle>
                    <AlertDescription>
                        <p>{dictionary.confirmation.error.description}</p>
                         <Button asChild className="mt-4 w-full transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">
                            <Link href="/">{dictionary.confirmation.error.backButton}</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
             </div>
        )
    }
    
    if (!vehicle) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }

    const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
    
    if (uploadSuccess) {
        const driverWhatsappUrl = driver?.phone ? `https://wa.me/${driver.phone.replace(/\D/g, '')}` : "#";
        const adminWhatsappMessage = `Halo Admin, saya ingin konfirmasi pembayaran untuk pesanan dengan Order ID: ${orderId}`;
        const adminWhatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(adminWhatsappMessage)}`;

        return (
            <div className="container mx-auto max-w-lg py-8 md:py-12 px-4">
                 <Card>
                    <CardHeader className="p-6 md:p-8 text-center">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <CardTitle className="text-2xl md:text-3xl font-bold">Satu Langkah Lagi!</CardTitle>
                      <CardDescription className="text-muted-foreground mt-2 max-w-sm mx-auto">Bukti pembayaran Anda telah terkirim. Mohon konfirmasi pesanan Anda kepada admin kami melalui WhatsApp untuk mempercepat proses verifikasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">                        
                         <div className="text-left bg-muted/30 rounded-lg p-4 mt-6 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{dictionary.confirmation.orderNumber}:</span>
                                <span className="font-mono font-semibold">{orderId || '...'}</span>
                            </div>
                            <Separator />
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{dictionary.confirmation.vehicle}:</span>
                                <div>
                                    <p className="text-xs text-right font-light text-muted-foreground">{vehicle.brand}</p>
                                    <p className="font-semibold text-right -mt-1">{vehicle.name}</p>
                                </div>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">{dictionary.confirmation.rentalPeriod}:</span>
                                <span className="font-semibold">{formattedRentalPeriod}</span>
                            </div>
                            {driver && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{dictionary.confirmation.driver}:</span>
                                    <span className="font-semibold">{driver.name}</span>
                                </div>
                            )}
                            <Separator />
                             <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">{dictionary.confirmation.totalPayment}:</span>
                                <span className="font-semibold text-primary">{total ? formatCurrency(Number(total)) : '-'}</span>
                            </div>
                         </div>

                         <div className="mt-8 grid gap-2">
                            <Button asChild className="w-full transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">
                                <Link href={adminWhatsappUrl} target="_blank">
                                    <WhatsAppIcon className="h-4 w-4 mr-2" />
                                    {dictionary.confirmation.upload.success.contactAdmin}
                                </Link>
                            </Button>
                            {showDriverContact && (
                                 <Button asChild variant="outline" className="w-full">
                                    <Link href={driverWhatsappUrl} target="_blank">
                                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                                        Hubungi Supir
                                    </Link>
                                </Button>
                            )}
                         </div>
                    </CardContent>
                </Card>
                <div className="mt-6 text-center">
                    <Button asChild variant="ghost" className="text-muted-foreground">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4 mr-2" /> 
                            {dictionary.backToHome}
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    const qrCodeUrl = orderId && total ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AUTORENT-PAYMENT-${orderId}-${total}` : '';


    return (
        <div className="container mx-auto max-w-lg py-8 md:py-12 px-4">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
                <Card className="w-full">
                    <CardHeader className="p-6 md:p-8 text-center">
                        <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                        <CardTitle className="text-2xl md:text-3xl font-bold">Selesaikan Pembayaran</CardTitle>
                        <CardDescription className="text-muted-foreground mt-2">{dictionary.confirmation.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="text-left bg-muted/30 rounded-lg p-4 mt-6 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{dictionary.confirmation.orderNumber}:</span>
                                <span className="font-mono text-sm font-semibold">{orderId || '...'}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{dictionary.confirmation.status}:</span>
                                <span className="font-semibold text-sm text-yellow-600">{dictionary.confirmation.statusAwaitingPayment}</span>
                            </div>
                            <Separator className="my-1"/>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{dictionary.confirmation.vehicle}:</span>
                                <div>
                                    <p className="text-xs text-right font-light text-muted-foreground">{vehicle.brand}</p>
                                    <p className="font-semibold text-sm text-right -mt-1">{vehicle.name}</p>
                                </div>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{dictionary.confirmation.rentalPeriod}:</span>
                                <span className="font-semibold text-sm">{formattedRentalPeriod}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{dictionary.confirmation.service}:</span>
                                <span className="font-semibold text-sm capitalize">{service?.replace('-', ' ')}</span>
                            </div>
                            {maticFee && Number(maticFee) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Biaya Tambahan Matic</span>
                                    <span className="font-semibold text-sm">{formatCurrency(Number(maticFee))}</span>
                                </div>
                            )}
                            {discount && Number(discount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span className="text-sm font-medium">Diskon</span>
                                    <span className="font-semibold text-sm">- {formatCurrency(Number(discount))}</span>
                                </div>
                            )}
                             <Separator className="my-1"/>
                             <div className="flex justify-between items-baseline">
                                <span className="text-sm text-muted-foreground">{dictionary.confirmation.totalPayment}:</span>
                                <span className="font-semibold text-xl text-primary">{total ? formatCurrency(Number(total)) : '-'}</span>
                            </div>
                        </div>
                        
                        <Separator className="my-6" />

                        {paymentMethod === 'bank' ? (
                            <div className="text-left">
                                <h2 className="font-semibold text-lg mb-3">{dictionary.confirmation.paymentInstructions.bank.title}</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {dictionary.confirmation.paymentInstructions.bank.description}
                                </p>
                                <div className="space-y-3">
                                    <Select onValueChange={setSelectedBankId} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder={dictionary.confirmation.paymentInstructions.bank.selectBank} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map(acc => (
                                                <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                                                    {acc.bankName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedBank && <BankAccountDetails bank={selectedBank} />}
                                </div>
                            </div>
                        ) : (
                             <div className="text-center">
                                 <div className="flex justify-center mb-2">
                                     <div className="relative h-10 w-28">
                                         <Image
                                             src="https://upload.wikimedia.org/wikipedia/commons/e/e1/QRIS_logo.svg"
                                             alt="QRIS Logo"
                                             fill
                                             className="object-contain"
                                         />
                                     </div>
                                 </div>
                                <h2 className="font-semibold text-lg mb-2 text-center">{dictionary.confirmation.paymentInstructions.qris.title}</h2>
                                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                                    {dictionary.confirmation.paymentInstructions.qris.description}
                                </p>
                                <div className="flex flex-col items-center my-4 gap-3">
                                    {qrCodeUrl && (
                                        <>
                                            <Image 
                                                src={qrCodeUrl}
                                                width={200}
                                                height={200}
                                                alt="QRIS Payment Code"
                                                data-ai-hint="QR code"
                                                className="rounded-lg border"
                                            />
                                            <Button variant="outline" asChild>
                                                <a href={qrCodeUrl} download={`qris-payment-${orderId}.png`}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Unduh Kode QR
                                                </a>
                                            </Button>
                                        </>
                                    )}
                                </div>
                                 <Alert>
                                    <AlertTitle>{dictionary.confirmation.paymentInstructions.qris.important.title}</AlertTitle>
                                    <AlertDescription>
                                        {dictionary.confirmation.paymentInstructions.qris.important.description}
                                    </AlertDescription>
                                </Alert>
                             </div>
                        )}
                    </CardContent>
                </Card>

                <UploadProof 
                    onUpload={handleUploadSuccess}
                    orderId={orderId}
                    isBankTransfer={paymentMethod === 'bank'}
                    isBankSelected={!!selectedBankId}
                />
                
        </div>
    )
}

export default function KonfirmasiPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <KonfirmasiComponent />
        </Suspense>
    )
}

      

    