'use client';

import { useState, useTransition, useEffect, useCallback, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vehicle } from "@/lib/types";
import { MoreVertical, PlusCircle, Trash2, Upload, Loader2, Sparkles, CheckCircle, Clock, Car } from "lucide-react";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useVehicleLogo } from "@/hooks/use-vehicle-logo";
import { useForm, SubmitHandler } from "react-hook-form";
import { upsertVehicle, deleteVehicle } from "./actions";
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from "@supabase/supabase-js";
import { useDebounce } from "@/hooks/use-debounce";
import { createSignedUploadUrl } from "@/app/actions/upload-actions";

export const dynamic = 'force-dynamic';

function VehicleCard({ vehicle, onEdit, onDelete }: { vehicle: Vehicle, onEdit: (vehicle: Vehicle) => void, onDelete: (vehicleId: string) => void }) {
    const { logoUrl } = useVehicleLogo(vehicle.brand);

    const hasDiscount = vehicle.discountPercentage && vehicle.discountPercentage > 0;
    const discountedPrice = (hasDiscount && vehicle.price && vehicle.discountPercentage)
        ? vehicle.price * (1 - vehicle.discountPercentage / 100)
        : vehicle.price;
    const isSpecialUnit = vehicle.unitType === 'khusus';

    const formatPrice = (price: number | null) => {
        if (price === null) return 'N/A';
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
    }
    
    const getStatusInfo = (status: Vehicle['status']) => {
        switch (status) {
            case 'disewa':
                return { text: 'Disewa', icon: Car, className: 'bg-blue-100 text-blue-800' };
            case 'dipesan':
                return { text: 'Dipesan', icon: Clock, className: 'bg-yellow-100 text-yellow-800' };
            case 'tersedia':
            default:
                return { text: 'Tersedia', icon: CheckCircle, className: 'bg-green-100 text-green-800' };
        }
    };
    const statusInfo = getStatusInfo(vehicle.status);


    return (
        <Card className="overflow-hidden flex flex-col group">
            <CardHeader className="p-0 relative">
                 <div className="relative w-full aspect-3/2">
                    {vehicle.photo ? (
                        <Image
                            src={vehicle.photo}
                            alt={vehicle.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            data-ai-hint={vehicle.dataAiHint || 'car exterior'}
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                            No Image
                        </div>
                    )}
                 </div>
                 <div className="absolute top-2 right-2 flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onEdit(vehicle)}>Edit</DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Hapus</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini akan menghapus data kendaraan <span className="font-bold">{vehicle.brand} {vehicle.name} ({vehicle.code})</span> secara permanen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(vehicle.id)} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
                  {logoUrl && (
                    <div className="absolute top-3 right-3 bg-white/70 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                        <div className="relative h-8 w-12">
                            <Image
                                src={logoUrl}
                                alt={`${vehicle.brand} logo`}
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                 )}
                 <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs py-1", statusInfo.className)}>
                        <statusInfo.icon className="h-3 w-3 mr-1.5"/>
                        {statusInfo.text}
                    </Badge>
                     {isSpecialUnit && (
                        <Badge 
                            variant={vehicle.stock && vehicle.stock > 0 ? "default" : "secondary"}
                        >
                            Stok: {vehicle.stock}
                        </Badge>
                    )}
                </div>
                 {hasDiscount && (
                    <Badge variant="destructive" className="absolute top-2 left-2 shadow-lg">
                      {vehicle.discountPercentage}% OFF
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                 <div>
                    <p className="text-xs font-light text-muted-foreground">{vehicle.brand}</p>
                    <h3 className="text-lg font-bold -mt-0.5">{vehicle.name}</h3>
                    <p className="text-sm text-muted-foreground">{vehicle.type} - {vehicle.year} ({vehicle.code})</p>
                </div>
                <div className="text-sm mt-4 text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2">
                    <span><span className="font-medium text-foreground">Penumpang:</span> {vehicle.passengers}</span>
                    <span><span className="font-medium text-foreground">Transmisi:</span> {vehicle.transmission}</span>
                    <span><span className="font-medium text-foreground">Bahan Bakar:</span> {vehicle.fuel}</span>
                     <span><span className="font-medium text-foreground">Tipe Unit:</span> <span className="capitalize">{vehicle.unitType || 'biasa'}</span></span>
                </div>
            </CardContent>
            <CardFooter className="p-4 mt-auto bg-muted/50">
                <div className="w-full flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Harga / hari</p>
                    {hasDiscount && discountedPrice ? (
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground line-through">{formatPrice(vehicle.price)}</p>
                            <p className="text-lg font-bold text-primary">{formatPrice(discountedPrice)}</p>
                        </div>
                    ) : (
                        <p className="text-lg font-bold text-primary">
                           {formatPrice(vehicle.price)}
                        </p>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

function VehicleForm({ vehicle, onSave, onCancel }: { vehicle?: Vehicle | null; onSave: () => void; onCancel: () => void; }) {
    const { toast } = useToast();
    const supabase = createClient();
    const [isPending, startTransition] = useTransition();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Vehicle>({
        defaultValues: vehicle || { id: crypto.randomUUID(), code: '', unitType: 'biasa', stock: 0, status: 'tersedia' }
    });
    
    const [previewUrl, setPreviewUrl] = useState<string | null>(vehicle?.photo || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const vehicleName = watch('name');
    const brand = watch('brand');
    const unitType = watch('unitType');
    const debouncedName = useDebounce(vehicleName, 500);

    const { logoUrl } = useVehicleLogo(brand);

    useEffect(() => {
        if (vehicle?.photo) {
            setPreviewUrl(vehicle.photo);
            setValue('photo', vehicle.photo);
        }
    }, [vehicle, setValue]);

    useEffect(() => {
        if (!debouncedName || vehicle) return;
        
        const fetchExistingVariant = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('vehicles')
                .select('brand, type, photo')
                .ilike('name', `%${debouncedName}%`)
                .limit(1);

            if (data && data.length > 0) {
                const existingVehicle = data[0];
                setValue('brand', existingVehicle.brand, { shouldValidate: true });
                setValue('type', existingVehicle.type, { shouldValidate: true });
                if (existingVehicle.photo) {
                    setPreviewUrl(existingVehicle.photo);
                    setValue('photo', existingVehicle.photo, { shouldValidate: true });
                }
                toast({
                    title: "Varian Ditemukan!",
                    description: `Data dari mobil ${existingVehicle.brand} ${debouncedName} telah diisi otomatis.`,
                    className: "bg-blue-50 border-blue-200 text-blue-800"
                });
            }
        };

        fetchExistingVariant();

    }, [debouncedName, setValue, vehicle, toast]);
    
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
    
    const onSubmit: SubmitHandler<Vehicle> = (data) => {
        startTransition(async () => {
            let photoUrl = vehicle?.photo || null;

            // 1. Handle file upload if a new file is selected
            if (selectedFile) {
                const fileExtension = selectedFile.name.split('.').pop();
                const fileName = `vehicle-${data.id}-${Date.now()}.${fileExtension}`;
                const filePath = `public/vehicles/${fileName}`;
                
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
                photoUrl = publicUrl;
            }
            
            if (!photoUrl) {
                toast({ variant: "destructive", title: "Foto wajib diisi" });
                return;
            }

            const vehicleData: Vehicle = {
                ...data,
                photo: photoUrl,
                price: Number(data.price),
                year: data.year ? Number(data.year) : null,
                passengers: data.passengers ? Number(data.passengers) : null,
                stock: data.unitType === 'khusus' ? Number(data.stock) : null,
                rating: data.rating || 5,
                discountPercentage: data.discountPercentage || null,
                status: data.status || 'tersedia',
            };

            const result = await upsertVehicle(vehicleData);

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Gagal Menyimpan",
                    description: result.error.message,
                });
            } else {
                 toast({
                    title: vehicle ? "Kendaraan Diperbarui" : "Kendaraan Ditambahkan",
                    description: `Data untuk ${result.data?.brand} ${result.data?.name} telah disimpan.`,
                });
                onSave();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="max-h-[70vh] overflow-y-auto pr-4 px-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4 px-6">
                    <div className="lg:col-span-1 space-y-2">
                        <Label>Foto Mobil</Label>
                        <div className="mt-2 flex flex-col items-center gap-4">
                            <div className="relative aspect-3/2 w-full rounded-md overflow-hidden border">
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt="Pratinjau Mobil"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="aspect-3/2 w-full p-8 flex justify-center items-center bg-muted rounded-md border border-dashed">
                                        <p className="text-sm text-center text-muted-foreground">Pratinjau akan muncul di sini</p>
                                    </div>
                                )}
                                {logoUrl && (
                                     <div className="absolute top-3 right-3 bg-white/70 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                                        <div className="relative h-8 w-12">
                                            <Image
                                                src={logoUrl}
                                                alt={`${brand} logo`}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Label htmlFor="photo-upload" className={cn("w-full cursor-pointer", "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", "border border-input bg-background hover:bg-accent hover:text-accent-foreground", "h-10 px-4 py-2")}>
                                <Upload className="mr-2 h-4 w-4" />
                                Pilih File Foto...
                            </Label>
                            <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            {errors.photo && <p className="text-sm text-destructive">{errors.photo.message}</p>}
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2 grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="unitType">Tipe Unit</Label>
                                <Select value={unitType || 'biasa'} onValueChange={(value) => setValue('unitType', value as 'biasa' | 'khusus')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Tipe Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="biasa">Unit Biasa (Stok Unlimited)</SelectItem>
                                        <SelectItem value="khusus">Unit Khusus (Stok Terbatas)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {unitType === 'khusus' && (
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Jumlah Stok</Label>
                                    <Input id="stock" type="number" placeholder="cth. 3" {...register('stock')} />
                                </div>
                            )}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="code">Kode Unit</Label>
                            <Input id="code" placeholder="cth. AVZ-01" {...register('code', { required: "Kode unit wajib diisi" })} />
                             {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name">Nama Mobil</Label>
                            <Input id="name" placeholder="cth. Avanza" {...register('name', { required: "Nama mobil wajib diisi" })} />
                             {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand Mobil</Label>
                            <Input 
                                id="brand" 
                                placeholder="cth. Toyota"
                                {...register('brand', { required: "Brand wajib diisi" })} 
                            />
                            {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipe Mobil</Label>
                            <Input id="type" placeholder="cth. MPV" {...register('type')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passengers">Jumlah Penumpang</Label>
                            <Input id="passengers" type="number" placeholder="cth. 7" {...register('passengers')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transmission">Transmisi</Label>
                            <Select onValueChange={(value) => setValue('transmission', value as 'Manual' | 'Matic')} defaultValue={vehicle?.transmission}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Transmisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                    <SelectItem value="Matic">Matic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fuel">Jenis Bahan Bakar</Label>
                            <Select onValueChange={(value) => setValue('fuel', value)} defaultValue={vehicle?.fuel || undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Jenis Bahan Bakar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bensin">Bensin</SelectItem>
                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    <SelectItem value="Listrik">Listrik</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Tahun</Label>
                            <Input id="year" type="number" placeholder="cth. 2022" {...register('year')} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="price">Harga Sewa / Hari</Label>
                            <Input id="price" type="number" placeholder="cth. 350000" {...register('price', { required: "Harga wajib diisi", min: { value: 1, message: "Harga tidak valid" }})} />
                            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                        </div>
                    </div>
                </div>
            </div>
             <DialogFooter className="pt-4 border-t px-6 pb-6 bg-background rounded-b-lg">
                <Button variant="outline" onClick={onCancel} disabled={isPending}>Batal</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isPending ? "Menyimpan..." : vehicle ? "Simpan Perubahan" : "Simpan Kendaraan"}
                </Button>
            </DialogFooter>
        </form>
    )
}

function ArmadaPage() {
    const [fleet, setFleet] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [isDeleting, startDeleteTransition] = useTransition();

    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    const fetchFleet = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        let query = supabase.from('vehicles').select('*');
        if (debouncedSearchTerm) {
            query = query.or(`name.ilike.%${debouncedSearchTerm}%,brand.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            toast({ variant: "destructive", title: "Gagal memuat armada", description: error.message });
        } else {
            setFleet(data || []);
        }
        setIsLoading(false);
    }, [supabase, debouncedSearchTerm, toast]);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (supabase) {
          fetchFleet();
        }
    }, [supabase, fetchFleet]);

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setFormOpen(true);
    };

    const handleDelete = (vehicleId: string) => {
        startDeleteTransition(async () => {
            const { error } = await deleteVehicle(vehicleId);
            if (error) {
                toast({ variant: "destructive", title: "Gagal menghapus", description: error.message });
            } else {
                toast({ title: "Kendaraan Dihapus" });
                fetchFleet();
            }
        });
    };

    const handleSave = () => {
        setFormOpen(false);
        setSelectedVehicle(null);
        fetchFleet();
    };

    const dialogTitle = selectedVehicle ? "Edit Kendaraan" : "Tambahkan Kendaraan Baru";
    const dialogDescription = selectedVehicle ? "Perbarui detail kendaraan di bawah ini." : "Isi detail kendaraan baru untuk menambahkannya ke armada.";

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Armada</h1>
                    <p className="text-muted-foreground">
                        Kelola seluruh unit kendaraan yang tersedia untuk disewa.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Cari armada (nama/brand/kode)..."
                        className="w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button className="w-full" onClick={() => { setSelectedVehicle(null); setFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Armada
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-16 flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memuat data armada...
                </div>
            ) : fleet.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {fleet.map((vehicle) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Tidak Ada Hasil</h3>
                    <p className="text-muted-foreground mt-2">Tidak ada kendaraan yang cocok dengan pencarian Anda.</p>
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-4xl p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDescription}</DialogDescription>
                    </DialogHeader>
                    <VehicleForm vehicle={selectedVehicle} onSave={handleSave} onCancel={() => setFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ArmadaPage;

    