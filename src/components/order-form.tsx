
'use client';

import { useState, useMemo, useEffect, forwardRef, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label"
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


import type { Vehicle, Driver } from '@/lib/types';
import { Minus, Plus, CalendarIcon, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInCalendarDays, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceCosts } from '@/app/dashboard/keuangan/actions';
import { checkVehicleAvailability } from '@/app/actions/reservation-actions';
import { useDebounce } from '@/hooks/use-debounce';


export const OrderForm = forwardRef<HTMLDivElement, { variants: Vehicle[] }>(({ variants }, ref) => {
    const { dictionary, language } = useLanguage();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [serviceCosts, setServiceCosts] = useState<{ driver: number, matic: number, fuel: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('direct');
    const [rentalDays, setRentalDays] = useState(1);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [service, setService] = useState('lepas-kunci');
    const [driverId, setDriverId] = useState<string | undefined>(undefined);
    const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(variants[0]?.id);

    const [isStartCalendarOpen, setStartCalendarOpen] = useState(false);
    const [isEndCalendarOpen, setEndCalendarOpen] = useState(false);
    
    const [isCheckingAvailability, startAvailabilityCheck] = useTransition();
    const [isAvailable, setIsAvailable] = useState(true);

    const showDriverSelection = service === 'dengan-supir' || service === 'all-include';

    const representativeVehicle = useMemo(() => {
        if (!variants || variants.length === 0) return null;
        return variants.reduce((lowest, current) => {
            const lowestPrice = lowest.discountPercentage ? (lowest.price! * (1 - lowest.discountPercentage / 100)) : lowest.price;
            const currentPrice = current.discountPercentage ? (current.price! * (1 - current.discountPercentage / 100)) : current.price;
            return lowestPrice! < currentPrice! ? lowest : current;
        });
    }, [variants]);
    
    const selectedVehicle = useMemo(() => {
        return variants.find(v => v.id === selectedVariantId);
    }, [variants, selectedVariantId]);

    const calculatedDuration = useMemo(() => {
        if (activeTab === 'direct') {
            return rentalDays > 0 ? rentalDays : 1;
        }
        if (activeTab === 'reservation' && startDate && endDate) {
            const diff = differenceInCalendarDays(endDate, startDate);
            return diff >= 1 ? diff : 1;
        }
        return 1;
    }, [startDate, endDate, rentalDays, activeTab]);

    const debouncedStartDate = useDebounce(startDate, 500);
    const debouncedEndDate = useDebounce(endDate, 500);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
        const today = startOfDay(new Date());
        setStartDate(today);
        setEndDate(addDays(today, 1));
    }, []);

    useEffect(() => {
        if (!supabase) return;
        
        const fetchInitialData = async () => {
            setIsLoading(true);
            const { data: driverData } = await supabase
                .from('drivers')
                .select('*')
                .eq('status', 'Tersedia');
            if (driverData) {
                setAvailableDrivers(driverData);
                if (showDriverSelection && driverData.length > 0) {
                    setDriverId(driverData[0].id);
                }
            }

            const { data: costsData } = await getServiceCosts();
            if (costsData) {
                setServiceCosts(costsData);
            }
            setIsLoading(false);
        };
        fetchInitialData();
    }, [supabase, showDriverSelection]);

    useEffect(() => {
        if (showDriverSelection && availableDrivers.length > 0) {
            if (!driverId) {
                setDriverId(availableDrivers[0].id);
            }
        } else {
            setDriverId(undefined);
        }
    }, [showDriverSelection, availableDrivers, driverId]);
    
    // Availability check effect
    useEffect(() => {
        if (activeTab !== 'reservation' || !debouncedStartDate || !debouncedEndDate || !selectedVehicle) {
            setIsAvailable(true); // Always available for direct booking
            return;
        }

        startAvailabilityCheck(async () => {
            const { data, error } = await checkVehicleAvailability(
                selectedVehicle.id,
                debouncedStartDate.toISOString(),
                debouncedEndDate.toISOString()
            );

            if (error) {
                console.error("Availability check failed:", error.message);
                setIsAvailable(false); // Assume not available on error
            } else {
                setIsAvailable(data);
            }
        });
    }, [debouncedStartDate, debouncedEndDate, selectedVehicle, activeTab]);


    const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

    const { totalCost, discountAmount, baseRentalCost, maticFee, driverFee, fuelFee } = useMemo(() => {
        if (!selectedVehicle || calculatedDuration <= 0 || !serviceCosts) {
            return { totalCost: 0, discountAmount: 0, baseRentalCost: 0, maticFee: 0, driverFee: 0, fuelFee: 0 };
        }
        
        const rental = (selectedVehicle.price || 0) * calculatedDuration;
        const mFee = selectedVehicle.transmission === 'Matic' ? serviceCosts.matic * calculatedDuration : 0;
        const dFee = (service === 'dengan-supir' || service === 'all-include') ? serviceCosts.driver * calculatedDuration : 0;
        const fFee = (service === 'all-include') ? serviceCosts.fuel * calculatedDuration : 0;

        const subtotal = rental + mFee + dFee + fFee;

        const discAmount = selectedVehicle.discountPercentage
            ? (rental * selectedVehicle.discountPercentage) / 100
            : 0;

        const total = subtotal - discAmount;

        return {
            totalCost: total,
            discountAmount: discAmount,
            baseRentalCost: rental,
            maticFee: mFee,
            driverFee: dFee,
            fuelFee: fFee,
        };
    }, [selectedVehicle, calculatedDuration, service, serviceCosts]);
    
    const handleStartDateChange = (date: Date | undefined) => {
        if (!date) return;
        const newStartDate = startOfDay(date);
        setStartDate(newStartDate);
        
        if (endDate && isBefore(endDate, newStartDate)) {
            setEndDate(addDays(newStartDate, 1));
        } else if (!endDate) {
             setEndDate(addDays(newStartDate, 1));
        }

        setStartCalendarOpen(false);
    };
    
    const handleEndDateChange = (date: Date | undefined) => {
        if (!date || !startDate) return;
        let newEndDate = startOfDay(date);
        if (isBefore(newEndDate, startDate)) {
            newEndDate = startOfDay(startDate);
        }
        setEndDate(newEndDate);
        setEndCalendarOpen(false);
    };

    const isBookingDisabled = (showDriverSelection && !driverId) || calculatedDuration <= 0 || !selectedVehicle || isLoading || (activeTab === 'reservation' && (!isAvailable || isCheckingAvailability));

    const paymentUrl = useMemo(() => {
        if (isBookingDisabled || !selectedVehicle) return '#';
        
        const params = new URLSearchParams({
            vehicleId: selectedVehicle.id,
            days: String(calculatedDuration),
            service: service,
            baseCost: String(baseRentalCost),
            totalCost: String(totalCost),
            maticFee: String(maticFee),
            driverFee: String(driverFee),
            fuelFee: String(fuelFee),
            discount: String(discountAmount),
            isPartnerUnit: String(selectedVehicle.unitType === 'khusus'),
        });

        if (activeTab === 'reservation' && startDate && endDate) {
            params.append('startDate', startDate.toISOString());
            params.append('endDate', endDate.toISOString());
        }
        if (driverId) {
            params.append('driverId', driverId);
        }
        
        return `/pembayaran?${params.toString()}`;

    }, [isBookingDisabled, selectedVehicle, calculatedDuration, service, activeTab, startDate, endDate, driverId, baseRentalCost, totalCost, maticFee, driverFee, fuelFee, discountAmount]);

    const locale = language === 'id' ? id : undefined;

    if (!representativeVehicle || isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
    }

    return (
      <div className="flex flex-col h-full" ref={ref}>
        <SheetHeader className="p-6 border-b flex-shrink-0">
          <SheetTitle>{dictionary.orderForm.title}</SheetTitle>
          <SheetDescription>
            Pilih jenis dan durasi sewa, lalu lanjutkan ke pembayaran.
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-6 border-b flex-shrink-0">
            <div className="flex items-center gap-4">
                <Image src={representativeVehicle.photo || ''} alt={representativeVehicle.name} width={120} height={80} className="rounded-lg object-cover aspect-3/2" data-ai-hint={representativeVehicle.dataAiHint || ''} />
                <div>
                    <p className="text-base font-light text-muted-foreground">{representativeVehicle.brand}</p>
                    <h3 className="font-bold text-lg -mt-1">{representativeVehicle.name}</h3>
                    <p className="text-sm text-muted-foreground">{representativeVehicle.type}</p>
                </div>
            </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
            <Tabs defaultValue="direct" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="direct">{dictionary.orderForm.tabs.direct.title}</TabsTrigger>
                    <TabsTrigger value="reservation">{dictionary.orderForm.tabs.reservation.title}</TabsTrigger>
                </TabsList>
                <TabsContent value="direct" className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{dictionary.orderForm.tabs.direct.duration}</label>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setRentalDays(Math.max(1, rentalDays - 1))} className="hover:bg-transparent text-muted-foreground hover:text-primary">
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="h-10 w-16 flex items-center justify-center border border-input rounded-md text-sm">
                                {rentalDays}
                            </div>
                             <Button variant="ghost" size="icon" onClick={() => setRentalDays(rentalDays + 1)} className="hover:bg-transparent text-muted-foreground hover:text-primary">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="reservation" className="mt-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <Label htmlFor="start-date">{dictionary.orderForm.tabs.reservation.startDate}</Label>
                              <Popover open={isStartCalendarOpen} onOpenChange={setStartCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal text-sm px-2">
                                        <CalendarIcon className="mr-1 h-4 w-4" />
                                        <span className="truncate w-full">
                                            {startDate ? format(startDate, 'd LLL y', { locale }) : <span>{dictionary.orderForm.tabs.reservation.selectDate}</span>}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={handleStartDateChange}
                                        disabled={{ before: startOfDay(new Date()) }}
                                        initialFocus
                                        locale={locale}
                                    />
                                </PopoverContent>
                            </Popover>
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="end-date">{dictionary.orderForm.tabs.reservation.endDate}</Label>
                             <Popover open={isEndCalendarOpen} onOpenChange={setEndCalendarOpen}>
                                <PopoverTrigger asChild>
                                     <Button variant="outline" className="w-full justify-start text-left font-normal text-sm px-2" disabled={!startDate}>
                                        <CalendarIcon className="mr-1 h-4 w-4" />
                                        <span className="truncate w-full">
                                            {endDate ? format(endDate, 'd LLL y', { locale }) : <span>{dictionary.orderForm.tabs.reservation.selectDate}</span>}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={handleEndDateChange}
                                        disabled={startDate ? { before: addDays(startDate,1) } : { before: startOfDay(new Date()) }}
                                        initialFocus
                                        locale={locale}
                                    />
                                </PopoverContent>
                            </Popover>
                         </div>
                     </div>
                     {isCheckingAvailability && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span>Mengecek ketersediaan...</span>
                        </div>
                     )}
                      {!isCheckingAvailability && !isAvailable && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Tidak Tersedia</AlertTitle>
                            <AlertDescription>
                                Mobil ini tidak tersedia pada rentang tanggal yang Anda pilih. Silakan pilih tanggal lain.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                {/* Common Fields */}
                <div className="space-y-4 pt-4 border-t mt-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{dictionary.orderForm.common.transmission.label}</label>
                         <Select onValueChange={setSelectedVariantId} defaultValue={selectedVariantId} disabled={variants.length <= 1}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Transmisi" />
                            </SelectTrigger>
                            <SelectContent>
                                {variants.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.transmission}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">{dictionary.orderForm.common.service.label}</label>
                        <Select value={service} onValueChange={setService}>
                            <SelectTrigger>
                                <SelectValue placeholder={dictionary.orderForm.common.service.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lepas-kunci">{dictionary.orderForm.common.service.options.selfDrive}</SelectItem>
                                <SelectItem value="dengan-supir">{dictionary.orderForm.common.service.options.withDriver}</SelectItem>
                                <SelectItem value="all-include">{dictionary.orderForm.common.service.options.allInclude}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Tabs>
        </div>
        <div className="p-6 border-t mt-auto bg-background flex-shrink-0">
             <div className="space-y-4">
                <h4 className="font-semibold text-base">{dictionary.orderForm.summary.title}</h4>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>{dictionary.orderForm.summary.basePrice(calculatedDuration)}</span>
                        <span>{formatCurrency(baseRentalCost)}</span>
                    </div>
                    {driverFee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>{dictionary.orderForm.summary.driverFee}</span>
                            <span>{formatCurrency(driverFee)}</span>
                        </div>
                    )}
                    {fuelFee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>{dictionary.orderForm.summary.fuelFee}</span>
                            <span>{formatCurrency(fuelFee)}</span>
                        </div>
                    )}
                    {maticFee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>{dictionary.orderForm.summary.maticFee}</span>
                            <span>{formatCurrency(maticFee)}</span>
                        </div>
                    )}
                    {discountAmount > 0 && selectedVehicle && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Diskon ({selectedVehicle.discountPercentage}%)</span>
                            <span>- {formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center font-bold text-lg">
                    <span>{dictionary.orderForm.summary.total}</span>
                    <span className="text-primary">{formatCurrency(totalCost)}</span>
                </div>
             </div>

             <Button className="w-full mt-6 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100" disabled={isBookingDisabled} asChild>
                <Link href={paymentUrl}>
                    {isCheckingAvailability ? 'Memeriksa...' : dictionary.orderForm.bookNow}
                </Link>
            </Button>
             {isBookingDisabled && showDriverSelection && !driverId && availableDrivers.length === 0 && (
                <p className="text-xs text-center mt-2 text-destructive">{dictionary.orderForm.common.driver.noAvailable}</p>
            )}
        </div>
      </div>
    );
});
OrderForm.displayName = 'OrderForm';
