'use client';

import { useState, ChangeEvent, useRef, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { PlusCircle, Edit, Trash2, Upload, Eye, Car, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Promotion, Vehicle } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { upsertVehicle } from '../armada/actions';
import { upsertPromotion, deletePromotion } from './actions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSignedUploadUrl } from '@/app/actions/upload-actions';


export const dynamic = 'force-dynamic';

// Form component for adding/editing a promotion
function PromotionForm({ promotion, vehicles, onSave, onCancel }: { promotion?: Promotion | null; vehicles: Vehicle[]; onSave: () => void; onCancel: () => void; }) {
    const { toast } = useToast();
    const supabase = createClient();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState(promotion?.title || '');
    const [description, setDescription] = useState(promotion?.description || '');
    const [previewUrl, setPreviewUrl] = useState<string | null>(promotion?.imageUrl || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [vehicleId, setVehicleId] = useState<string | undefined>(promotion?.vehicleId || undefined);
    
    const initialVehicle = vehicles.find(v => v.id === promotion?.vehicleId);
    const [discount, setDiscount] = useState<number | undefined>(initialVehicle?.discountPercentage || undefined);


    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            if (!title || !description) {
                toast({ variant: 'destructive', title: 'Formulir Tidak Lengkap', description: 'Judul dan deskripsi tidak boleh kosong.' });
                return;
            }

            let imageUrl = promotion?.imageUrl || null;

            if (selectedFile) {
                const fileExtension = selectedFile.name.split('.').pop();
                const fileName = `promo-${promotion?.id || Date.now()}.${fileExtension}`;
                const filePath = `public/promotions/${fileName}`;
                
                const { signedUrl, token, error: urlError } = await createSignedUploadUrl(filePath);
                if (urlError) {
                    toast({ variant: "destructive", title: "Gagal Mengunggah Foto", description: `Gagal membuat URL: ${urlError.message}` });
                    return;
                }
                const { error: uploadError } = await supabase.storage.from('mudakarya-bucket').uploadToSignedUrl(filePath, token, selectedFile);
                if (uploadError) {
                    toast({ variant: "destructive", title: "Gagal Mengunggah Foto", description: `Gagal mengunggah file: ${uploadError.message}` });
                    return;
                }
                const { data: { publicUrl } } = supabase.storage.from('mudakarya-bucket').getPublicUrl(filePath);
                imageUrl = publicUrl;
            }

            if (!imageUrl) {
                toast({ variant: 'destructive', title: 'Formulir Tidak Lengkap', description: 'Gambar promosi wajib diisi.' });
                return;
            }

            const newId = promotion?.id || `promo-${Date.now()}`;
            
            const promoData: Omit<Promotion, 'created_at'> = {
                id: newId,
                title,
                description,
                imageUrl: imageUrl,
                vehicleId: vehicleId === 'none' ? undefined : vehicleId,
            };

            const promoResult = await upsertPromotion(promoData);

            if (promoResult.error) {
                toast({ variant: 'destructive', title: 'Gagal Menyimpan Promosi', description: promoResult.error.message });
                return;
            }

            // Apply discount to the selected vehicle
            if (vehicleId && vehicleId !== 'none') {
                const vehicleToUpdate = vehicles.find(v => v.id === vehicleId);
                if (vehicleToUpdate) {
                    const updatedVehicle: Vehicle = { ...vehicleToUpdate, discountPercentage: discount || null };
                    const vehicleResult = await upsertVehicle(updatedVehicle);
                     if (vehicleResult.error) {
                        toast({ variant: 'destructive', title: 'Gagal Apply Diskon', description: `Promosi disimpan, tapi gagal menerapkan diskon ke kendaraan. ${vehicleResult.error.message}` });
                     }
                }
            }
            
            // Remove discount from old vehicle if it was changed
            if (promotion?.vehicleId && promotion.vehicleId !== vehicleId) {
                 const oldVehicle = vehicles.find(v => v.id === promotion.vehicleId);
                 if(oldVehicle) {
                    const updatedOldVehicle: Vehicle = { ...oldVehicle, discountPercentage: null };
                    await upsertVehicle(updatedOldVehicle);
                 }
            }

            toast({ title: "Promosi Disimpan" });
            onSave();
        });
    };

    return (
        <>
            <div className="max-h-[70vh] overflow-y-auto px-1 pr-4">
                <div className="grid gap-6 py-4 px-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Promosi</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. Promo Libur Lebaran" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi Singkat</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth. Diskon hingga 25% untuk semua tipe mobil!" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleId">Target Mobil (Opsional)</Label>
                            <Select onValueChange={setVehicleId} defaultValue={vehicleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih mobil..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tidak ada (Promo Umum)</SelectItem>
                                    {vehicles.map((vehicle) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.brand} {vehicle.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount">Diskon (%)</Label>
                            <Input 
                                id="discount" 
                                type="number"
                                value={discount || ''}
                                onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="cth. 25" 
                                disabled={!vehicleId || vehicleId === 'none'}
                            />
                            {(!vehicleId || vehicleId === 'none') && <p className="text-xs text-muted-foreground">Pilih mobil untuk mengaktifkan diskon.</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Gambar &amp; Pratinjau</Label>
                        <div className="mt-2 flex flex-col items-center gap-4">
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted">
                                {previewUrl ? (
                                    <>
                                        <Image
                                            src={previewUrl}
                                            alt="Pratinjau Promosi"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-4 flex flex-col items-start justify-center">
                                            <div className="max-w-md">
                                                <h3 className="text-xl font-bold text-white line-clamp-2">{title || 'Judul Promosi Anda'}</h3>
                                                <p className="text-sm text-primary-foreground/90 mt-1 line-clamp-2">{description || 'Deskripsi singkat promosi akan muncul di sini.'}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-2 justify-center items-center h-full text-center p-4">
                                        <Eye className="h-10 w-10 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Pratinjau slider akan muncul di sini setelah gambar diunggah</p>
                                    </div>
                                )}
                            </div>
                            <Label htmlFor="photo-upload" className={cn("w-full cursor-pointer", "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", "border border-input bg-background hover:bg-accent hover:text-accent-foreground", "h-10 px-4 py-2")}>
                                <Upload className="mr-2 h-4 w-4" />
                                {previewUrl ? 'Ganti Gambar...' : 'Pilih Gambar...'}
                            </Label>
                            <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter className="pt-4 border-t px-6 pb-6 bg-background rounded-b-lg">
                <Button variant="outline" onClick={onCancel} disabled={isPending}>Batal</Button>
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? 'Menyimpan...' : 'Simpan Promosi'}
                </Button>
            </DialogFooter>
        </>
    );
}

export default function PromosiPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
    const { toast } = useToast();
    const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
    const [isDeleting, startDeleteTransition] = useTransition();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const fetchData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data: promoData, error: promoError } = await supabase.from('promotions').select('*');
        const { data: vehicleData, error: vehicleError } = await supabase.from('vehicles').select('*');

        if (promoError) toast({ variant: 'destructive', title: 'Gagal memuat promosi', description: promoError.message });
        else setPromotions(promoData || []);

        if (vehicleError) toast({ variant: 'destructive', title: 'Gagal memuat kendaraan', description: vehicleError.message });
        else setVehicles(vehicleData || []);
        
        setIsLoading(false);
    }

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (supabase) {
            fetchData();
        }
    }, [supabase]);

    const handleAddClick = () => {
        setSelectedPromo(null);
        setFormOpen(true);
    };
    
    const handleEditClick = (promo: Promotion) => {
        setSelectedPromo(promo);
        setFormOpen(true);
    };

    const handleDelete = (promo: Promotion) => {
        startDeleteTransition(async () => {
            const result = await deletePromotion(promo.id);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Gagal menghapus promosi', description: result.error.message });
                return;
            }

            // Also remove discount from vehicle if it was linked
            if (promo.vehicleId) {
                const vehicleToUpdate = vehicles.find(v => v.id === promo.vehicleId);
                if(vehicleToUpdate) {
                    const updatedVehicle = { ...vehicleToUpdate, discountPercentage: null };
                    await upsertVehicle(updatedVehicle);
                }
            }

            toast({ title: "Promosi Dihapus" });
            fetchData();
        });
    };
    
    const handleFormSave = () => {
        setFormOpen(false);
        setSelectedPromo(null);
        fetchData();
    };

    const dialogTitle = selectedPromo ? "Edit Promosi" : "Tambahkan Promosi Baru";
    const dialogDescription = selectedPromo ? "Perbarui detail promosi di bawah ini." : "Isi detail promosi untuk slider di halaman utama.";

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editor Promosi</h1>
                <p className="text-muted-foreground">
                    Kelola promosi yang akan ditampilkan pada slider di halaman utama.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pratinjau Slider Promosi</CardTitle>
                        <CardDescription>Beginilah tampilan slider di halaman utama.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {promotions.length > 0 ? (
                        <Carousel
                            opts={{ loop: true }}
                            plugins={[plugin.current]}
                            onMouseEnter={plugin.current.stop}
                            onMouseLeave={plugin.current.reset}
                            className="w-full rounded-lg overflow-hidden border shadow-sm"
                        >
                            <CarouselContent>
                                {promotions.map((promo) => (
                                    <CarouselItem key={promo.id}>
                                        <div className="relative h-[40vh]">
                                            <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-6 flex flex-col items-start justify-center">
                                                <div className='max-w-md'>
                                                    <h2 className="text-3xl font-bold text-white">{promo.title}</h2>
                                                    <p className="text-lg text-primary-foreground/90 mt-2">{promo.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
                        </Carousel>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg bg-muted/50">
                            <h3 className="text-xl font-semibold">Belum Ada Promosi</h3>
                            <p className="text-muted-foreground mt-2 mb-6">Slider promosi di halaman utama masih kosong.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Daftar Promosi Aktif</CardTitle>
                        <CardDescription>Kelola semua promosi yang ada.</CardDescription>
                    </div>
                     <Button onClick={handleAddClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambahkan Promosi
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {promotions.length > 0 ? promotions.map(promo => {
                        const vehicle = vehicles.find(v => v.id === promo.vehicleId);
                        return (
                        <div key={promo.id} className="flex items-center gap-4 border rounded-lg p-3">
                            <Image src={promo.imageUrl} alt={promo.title} width={160} height={90} className="rounded-md object-cover aspect-video bg-muted" />
                            <div className="flex-grow">
                                <h4 className="font-bold">{promo.title}</h4>
                                <p className="text-sm text-muted-foreground">{promo.description}</p>
                                {vehicle && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 font-medium">
                                        <Car className="h-4 w-4" />
                                        <span>Promo untuk: {vehicle.brand} {vehicle.name} {vehicle.discountPercentage ? `(${vehicle.discountPercentage}% off)`: ''}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleEditClick(promo)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tindakan ini akan menghapus promosi "{promo.title}" secara permanen.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(promo)} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        )
                    }) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Tidak ada promosi aktif.</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-2xl p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDescription}</DialogDescription>
                    </DialogHeader>
                    <PromotionForm 
                        promotion={selectedPromo}
                        vehicles={vehicles}
                        onSave={handleFormSave}
                        onCancel={() => setFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

    