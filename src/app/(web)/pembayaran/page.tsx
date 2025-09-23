
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { serviceCosts } from '@/lib/data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, QrCode, ArrowLeft, Loader2 } from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import type { Vehicle } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

function PembayaranComponent() {
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    
    const vehicleId = searchParams.get('vehicleId');
    const daysStr = searchParams.get('days');
    const service = searchParams.get('service');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const driverId = searchParams.get('driverId');

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('bank');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    
    const days = useMemo(() => {
        if (startDateStr && endDateStr) {
            const diff = differenceInCalendarDays(new Date(endDateStr), new Date(startDateStr));
            return diff > 0 ? diff : 1;
        }
        return parseInt(daysStr || '1', 10);
    }, [startDateStr, endDateStr, daysStr]);


    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!vehicleId || !supabase) {
            if (!vehicleId) notFound();
            return;
        };
        
        const fetchVehicle = async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', vehicleId)
                .single();
            
            if (error || !data) {
                console.error('Vehicle not found:', error);
                notFound();
            } else {
                setVehicle(data);
            }
        };

        fetchVehicle();
    }, [vehicleId, supabase]);


    const { rentalPeriod, baseRentalCost, maticFee, driverFee, fuelFee, discountAmount, totalCost } = useMemo(() => {
        if (!vehicle) {
            return { rentalPeriod: '', baseRentalCost: 0, maticFee: 0, driverFee: 0, fuelFee: 0, discountAmount: 0, totalCost: 0 };
        }
        
        let period = `${days} ${dictionary.payment.days}`;
        if (startDateStr && endDateStr) {
            try {
                const start = parseISO(startDateStr);
                const end = parseISO(endDateStr);
                const locale = language === 'id' ? id : undefined;
                period = `${format(start, 'd LLL yy', { locale })} - ${format(end, 'd LLL yy', { locale })}`;
            } catch (error) {
                console.error("Error parsing date strings:", error);
            }
        }
        
        const rentalCost = (vehicle.price || 0) * days;
        const mFee = vehicle.transmission === 'Matic' ? serviceCosts.matic * days : 0;
        const dFee = (service === 'dengan-supir' || service === 'all-include') ? serviceCosts.driver * days : 0;
        
        const fFee = (service === 'all-include') ? serviceCosts.fuel * days : 0;

        const subtotal = rentalCost + mFee + dFee + fFee;
        
        const discAmount = vehicle.discountPercentage 
            ? (rentalCost * vehicle.discountPercentage) / 100
            : 0;

        const total = subtotal - discAmount;

        return { 
            rentalPeriod: period,
            baseRentalCost: rentalCost,
            maticFee: mFee,
            driverFee: dFee,
            fuelFee: fFee,
            discountAmount: discAmount,
            totalCost: total 
        };
    }, [vehicle, days, service, startDateStr, endDateStr, dictionary, language]);


    const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

    const isFormValid = useMemo(() => {
        return fullName.trim() !== '' && phone.trim() !== '';
    }, [fullName, phone]);

    const confirmationUrl = useMemo(() => {
        if (!isFormValid || !vehicle) return '#';
        let url = `/konfirmasi?paymentMethod=${paymentMethod}&total=${totalCost}&vehicleId=${vehicle.id}&days=${days}&service=${service}&name=${encodeURIComponent(fullName)}&phone=${encodeURIComponent(phone)}`;
        if (startDateStr) url += `&startDate=${startDateStr}`;
        if (endDateStr) url += `&endDate=${endDateStr}`;
        if (maticFee > 0) url += `&maticFee=${maticFee}`;
        if (discountAmount > 0) url += `&discount=${discountAmount}`;
        if (driverId) url += `&driverId=${driverId}`;

        return url;
    }, [isFormValid, paymentMethod, totalCost, vehicle, days, service, startDateStr, endDateStr, maticFee, discountAmount, fullName, phone, driverId]);

    const handleConfirmAndPay = () => {
        if (isFormValid) {
            router.push(confirmationUrl);
        } else {
             toast({
                variant: 'destructive',
                title: dictionary.payment.validation.title,
                description: dictionary.payment.validation.description,
            });
        }
    }
    
    if (!vehicle) {
        return <div className="flex h-screen items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />{dictionary.loading}...</div>;
    }

    return (
        <div className="container mx-auto max-w-lg py-8 md:py-12 px-4">
             <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
            </Button>
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{dictionary.payment.title}</h1>
                <p className="mt-3 text-lg text-muted-foreground">{dictionary.payment.description}</p>
            </div>
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>{dictionary.payment.orderSummary.title}</CardTitle>
                </CardHeader>
                <CardContent>
                        <div className="flex items-center gap-4 mb-6">
                        <Image src={vehicle.photo || ''} alt={vehicle.name || ''} width={120} height={80} className="rounded-lg object-cover" data-ai-hint={vehicle.dataAiHint || ''} />
                        <div>
                            <h3 className="font-bold text-lg">{vehicle.brand} {vehicle.name}</h3>
                            <p className="text-sm text-muted-foreground">{vehicle.type} - {vehicle.transmission}</p>
                        </div>
                    </div>
                    
                    <Separator className="my-4" />

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{dictionary.payment.orderSummary.rentalPeriod}</span>
                            <span>{rentalPeriod}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{dictionary.payment.orderSummary.rentalPrice(days)}</span>
                            <span>{formatCurrency(baseRentalCost)}</span>
                        </div>
                        {driverFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{dictionary.payment.orderSummary.driverFee(days)}</span>
                                <span>{formatCurrency(driverFee)}</span>
                            </div>
                        )}
                        {fuelFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{dictionary.payment.orderSummary.fuelFee(days)}</span>
                                <span>{formatCurrency(fuelFee)}</span>
                            </div>
                        )}
                        {maticFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{dictionary.payment.orderSummary.maticFee}</span>
                                <span>{formatCurrency(maticFee)}</span>
                            </div>
                        )}
                            {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span className="font-medium">Diskon ({vehicle.discountPercentage}%)</span>
                                <span>- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                            <Separator className="my-2"/>
                            <div className="flex justify-between font-bold text-lg pt-2">
                            <span>{dictionary.payment.orderSummary.totalPayment}</span>
                            <span className="text-primary">{formatCurrency(totalCost)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                        <CardTitle>{dictionary.payment.personalData.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">{dictionary.payment.personalData.fullName}</Label>
                        <Input 
                            id="fullName" 
                            placeholder={dictionary.payment.personalData.fullNamePlaceholder} 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">{dictionary.payment.personalData.phone}</Label>
                        <Input 
                            id="phone" 
                            placeholder={dictionary.payment.personalData.phonePlaceholder} 
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground pt-1">{dictionary.payment.personalData.phoneHint}</p>
                    </div>
                </CardContent>

                <Separator className="my-0"/>

                    <CardHeader>
                    <CardTitle>{dictionary.payment.paymentMethod.title}</CardTitle>
                </CardHeader>
                    <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <Label htmlFor="bank" className="flex items-start gap-4 p-4 rounded-md border has-[:checked]:border-primary cursor-pointer">
                            <RadioGroupItem value="bank" id="bank" className="mt-1"/>
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2 font-bold">
                                    <Banknote className="h-5 w-5" />
                                    <span>{dictionary.payment.paymentMethod.bank.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{dictionary.payment.paymentMethod.bank.description}</p>
                            </div>
                        </Label>
                            <Label htmlFor="qris" className="flex items-start gap-4 p-4 rounded-md border has-[:checked]:border-primary cursor-pointer">
                            <RadioGroupItem value="qris" id="qris" className="mt-1"/>
                            <div className="grid gap-1">
                                    <div className="flex items-center gap-2 font-bold">
                                    <QrCode className="h-5 w-5" />
                                    <span>{dictionary.payment.paymentMethod.qris.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{dictionary.payment.paymentMethod.qris.description}</p>
                            </div>
                        </Label>
                    </RadioGroup>
                    </CardContent>
                    
                    <Separator className="mt-4"/>

                    <div className="p-6">
                    <Alert>
                        <AlertTitle>{dictionary.payment.attention.title}</AlertTitle>
                        <AlertDescription>
                            {dictionary.payment.attention.description}
                        </AlertDescription>
                    </Alert>

                    <div className="mt-6">
                         <Button size="lg" className="w-full transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100" onClick={handleConfirmAndPay} disabled={!isFormValid}>
                            {dictionary.payment.confirmAndPay}
                        </Button>
                    </div>
                </div>

            </Card>
        </div>
    );
}

export default function PembayaranPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <PembayaranComponent />
        </Suspense>
    )
}
