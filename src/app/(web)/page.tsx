
'use client'

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"


import type { Promotion, Vehicle } from '@/lib/types';
import { Filter, Loader2 } from 'lucide-react';
import { VehicleCard } from '@/components/vehicle-card';
import { useLanguage } from '@/hooks/use-language';
import { FeaturesSection } from '@/components/features-section';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';


function HomePageContent() {
    const { dictionary } = useLanguage();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [fleet, setFleet] = useState<Vehicle[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [visibleCars, setVisibleCars] = useState(6);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ brand: 'all', type: 'all' });
    const [sortBy, setSortBy] = useState('price-asc');
    const [isSheetOpen, setSheetOpen] = useState(false);
    
    const plugin = useRef(
      Autoplay({ delay: 5000, stopOnInteraction: true })
    )

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);
    
    useEffect(() => {
        if (!supabase) return;
        const fetchData = async () => {
            setIsLoading(true);
            const { data: fleetData } = await supabase.from('vehicles').select('*');
            const { data: promotionsData } = await supabase.from('promotions').select('*');
            setFleet(fleetData || []);
            setPromotions(promotionsData || []);
            setIsLoading(false);
        }
        fetchData();
    }, [supabase]);

    const loadMoreCars = () => {
        setVisibleCars(prev => prev + 4);
    }
    
    const resetFilters = () => {
        setSearchQuery('');
        setFilters({ brand: 'all', type: 'all' });
        setSortBy('price-asc');
    };

    const handleBrandChange = (brand: string) => {
        setFilters(prev => ({ ...prev, brand: brand }));
    };

    const handleTypeChange = (type: string) => {
        setFilters(prev => ({ ...prev, type: type }));
        };
    
    const groupedAndFilteredFleet = useMemo(() => {
        if (!fleet) return [];

        // 1. Filter first
        const filtered = fleet.filter(vehicle => {
            const searchMatch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) || vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase());
            const brandMatch = filters.brand === 'all' || vehicle.brand === filters.brand;
            const typeMatch = filters.type === 'all' || vehicle.type === filters.type;
            return searchMatch && brandMatch && typeMatch;
        });

        // 2. Group by brand, name, and fuel type
        const grouped = filtered.reduce((acc, vehicle) => {
            const key = `${vehicle.brand}|${vehicle.name}|${vehicle.fuel}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(vehicle);
            return acc;
        }, {} as Record<string, Vehicle[]>);

        // 3. Create a representative vehicle for each group
        return Object.values(grouped).map(group => {
            // Find the vehicle with the lowest price in the group to be the representative
            const representative = group.reduce((lowest, current) => {
                const lowestPrice = lowest.discountPercentage ? (lowest.price! * (1 - lowest.discountPercentage / 100)) : lowest.price;
                const currentPrice = current.discountPercentage ? (current.price! * (1 - current.discountPercentage / 100)) : current.price;
                return lowestPrice! < currentPrice! ? lowest : current;
            });
            // Also store all variants in the representative vehicle object
            return { ...representative, variants: group };
        });

    }, [searchQuery, filters, fleet]);

    const availableBrands = useMemo(() => {
        if (!fleet) return [];
        const brands = new Set(
            fleet
                .map(v => v.brand)
                .filter((b): b is string => !!b)
        );
        return ['all', ...Array.from(brands)];
    }, [fleet]);

    const availableTypes = useMemo(() => {
        if (!fleet) return [];
        const types = new Set(
            fleet
                .map(v => v.type)
                .filter((t): t is string => !!t)
        );
        return ['all', ...Array.from(types)];
    }, [fleet]);

    const sortedFleet = useMemo(() => {
        return [...groupedAndFilteredFleet].sort((a, b) => {
            if (!a.price || !b.price) return 0;
            switch (sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'rating-desc':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });
    }, [groupedAndFilteredFleet, sortBy]);

  return (
        <div>
            {/* Hero Section with Promo Slider */}
            <section className="w-full">
                 <div className="relative group mt-4 px-4 md:px-0">
                    <Carousel 
                        opts={{ loop: true }}
                        plugins={[plugin.current]}
                        onMouseEnter={plugin.current.stop}
                        onMouseLeave={plugin.current.reset}
                        className="w-full rounded-lg overflow-hidden"
                    >
                        <CarouselContent>
                            {promotions.length > 0 ? promotions.map((promo) => (
                            <CarouselItem key={promo.id}>
                                <div className="relative h-[60vh] md:h-[70vh]">
                                    <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                                     <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-6 sm:p-8 md:p-12 flex flex-col items-start justify-center">
                                        <div className='max-w-md'>
                                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">{promo.title}</h2>
                                            <p className="text-base md:text-lg text-primary-foreground/80 mt-3 md:mt-4 hidden sm:block">{promo.description}</p>
                                             <Button size="lg" className="mt-6 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100" asChild>
                                                <Link href={promo.vehicleId ? `/mobil/${promo.vehicleId}` : "#fleet-section"}>
                                                    {dictionary.home.hero.bookNow}
                                                </Link>
                                            </Button>
                                        </div>
                                     </div>
                                </div>
                            </CarouselItem>
                            )) : (
                                <CarouselItem>
                                <div className="relative h-[60vh] md:h-[70vh]">
                                    <Image src="https://picsum.photos/seed/hero/1280/720" alt="Default Hero Image" fill className="object-cover" data-ai-hint="car road banner" />
                                     <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-6 sm:p-8 md:p-12 flex flex-col items-start justify-center">
                                        <div className='max-w-md'>
                                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">Sewa Mobil Mudah & Cepat</h2>
                                            <p className="text-base md:text-lg text-primary-foreground/80 mt-3 md:mt-4 hidden sm:block">Pesan kendaraan impian Anda untuk liburan atau kebutuhan bisnis dengan harga terbaik.</p>
                                            <Button size="lg" className="mt-6 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">{dictionary.home.hero.bookNow}</Button>
                                        </div>
                                     </div>
                                </div>
                            </CarouselItem>
                            )}
                        </CarouselContent>
                        {promotions.length > 1 && (
                            <>
                                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </>
                        )}
                    </Carousel>
                 </div>
            </section>
            
            {/* Features/Branding Section */}
            <FeaturesSection />

            {/* Main Content */}
            <section id="fleet-section" className="container py-8 md:py-16">
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{dictionary.home.fleet.title}</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                            placeholder={dictionary.home.fleet.searchPlaceholder} 
                            className="w-full sm:max-w-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className='w-full sm:w-auto'>
                                    <Filter className="mr-2 h-4 w-4" />
                                    {dictionary.home.fleet.filterAndSort}
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>{dictionary.home.fleet.filterAndSort}</SheetTitle>
                                    <SheetDescription>
                                        {dictionary.home.fleet.filterDescription}
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-4 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">{dictionary.home.fleet.filters.brand.title}</h4>
                                         <Select value={filters.brand} onValueChange={handleBrandChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={dictionary.home.fleet.filters.brand.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableBrands.map(brand => (
                                                    <SelectItem key={brand} value={brand}>
                                                        {brand === 'all' ? dictionary.home.fleet.filters.brand.all : brand}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                         <h4 className="font-semibold">{dictionary.home.fleet.filters.type.title}</h4>
                                          <Select value={filters.type} onValueChange={handleTypeChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={dictionary.home.fleet.filters.type.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                               {availableTypes.map(type => (
                                                    <SelectItem key={type} value={type}>
                                                        {type === 'all' ? dictionary.home.fleet.filters.type.all : type}
                                                    </SelectItem>
                                               ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">{dictionary.home.fleet.sort.title}</h4>
                                         <RadioGroup value={sortBy} onValueChange={setSortBy} className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="price-asc" id="s-price-asc" />
                                                <Label htmlFor="s-price-asc">{dictionary.home.fleet.sort.priceAsc}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="price-desc" id="s-price-desc" />
                                                <Label htmlFor="s-price-desc">{dictionary.home.fleet.sort.priceDesc}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="rating-desc" id="s-rating-desc" />
                                                <Label htmlFor="s-rating-desc">{dictionary.home.fleet.sort.ratingDesc}</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <SheetFooter>
                                    <Button variant="secondary" onClick={resetFilters}>{dictionary.home.fleet.reset}</Button>
                                    <Button onClick={() => setSheetOpen(false)}>{dictionary.home.fleet.showResults}</Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {isLoading ? (
                     <div className="text-center py-16 text-muted-foreground flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Memuat data armada...
                    </div>
                ) : sortedFleet.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {sortedFleet.slice(0, visibleCars).map(vehicle => (
                          <VehicleCard key={vehicle.id} vehicle={vehicle} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>Tidak ada mobil yang cocok dengan kriteria pencarian Anda.</p>
                  </div>
                )}

                {visibleCars < sortedFleet.length && (
                     <div className="mt-12 text-center">
                        <Button onClick={loadMoreCars} size="lg" variant="outline" className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">
                            {dictionary.home.fleet.showMore}
                        </Button>
                    </div>
                )}
            </section>
        </div>
  );
}

export default function HomePage() {
  return (
      <HomePageContent />
  )
}
