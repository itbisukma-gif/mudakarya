

'use client'

import Link from 'next/link';
import Image from 'next/image';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Users, Cog, Tag, Fuel } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { OrderForm } from '@/components/order-form';
import { useLanguage } from '@/hooks/use-language';
import { useVehicleLogo } from '@/hooks/use-vehicle-logo';
import { useMemo } from 'react';

// The vehicle prop might now have a `variants` property if it's a grouped representation
type VehicleCardProps = {
  vehicle: Vehicle & { variants?: Vehicle[] };
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { dictionary } = useLanguage();
  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
  
  // If there are variants, find the one with the lowest price to display.
  // The passed `vehicle` is already the representative with the lowest price.
  const displayVehicle = vehicle;
  
  const hasDiscount = displayVehicle.discountPercentage && displayVehicle.discountPercentage > 0;
  const discountedPrice = (hasDiscount && displayVehicle.price && displayVehicle.discountPercentage)
    ? displayVehicle.price * (1 - displayVehicle.discountPercentage / 100)
    : displayVehicle.price;

  const { logoUrl } = useVehicleLogo(displayVehicle.brand);

  const isOutOfStock = displayVehicle.unitType === 'khusus' && (!displayVehicle.stock || displayVehicle.stock <= 0);

  // The link should always point to the representative vehicle's detail page.
  const detailUrl = `/mobil/${displayVehicle.id}`;

  const availableTransmissionsText = useMemo(() => {
    if (vehicle.variants && vehicle.variants.length > 1) {
      const transmissionTypes = new Set(vehicle.variants.map(v => v.transmission));
      return Array.from(transmissionTypes).join(' | ');
    }
    return displayVehicle.transmission;
  }, [vehicle.variants, displayVehicle.transmission]);


  return (
      <Card className="overflow-hidden group flex flex-col h-full shadow-md">
          <div className="relative">
            <Link href={isOutOfStock ? '#' : detailUrl} className={isOutOfStock ? 'cursor-not-allowed' : ''}>
                <CardContent className="p-0">
                  <div className="aspect-3/2 w-full relative">
                      <Image
                        src={displayVehicle.photo!}
                        alt={displayVehicle.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        data-ai-hint={displayVehicle.dataAiHint || ''}
                      />
                      {logoUrl && (
                        <div className="absolute top-3 left-3 bg-white/70 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                           <div className="relative h-6 w-10">
                              <Image
                                  src={logoUrl}
                                  alt={`${displayVehicle.brand} logo`}
                                  fill
                                  className="object-contain"
                              />
                           </div>
                        </div>
                      )}
                  </div>
                </CardContent>
            </Link>
            {hasDiscount && !isOutOfStock && (
              <Badge variant="destructive" className="absolute top-2 right-2 shadow-lg">
                <Tag className="h-3 w-3 mr-1" />
                {displayVehicle.discountPercentage}% OFF
              </Badge>
            )}
            {isOutOfStock && (
                <Badge variant="secondary" className="absolute top-2 right-2 shadow-lg">
                    {dictionary.vehicleCard.outOfStock}
                </Badge>
            )}
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex-grow">
                <Link href={isOutOfStock ? '#' : detailUrl} className={isOutOfStock ? 'cursor-not-allowed' : 'hover:text-primary'}>
                    <h3 className="text-base font-bold leading-snug">{displayVehicle.brand} {displayVehicle.name}</h3>
                    <p className="text-xs text-muted-foreground">{displayVehicle.type}</p>
                </Link>
            </div>
             <div className="flex items-start justify-between text-xs text-muted-foreground mt-3">
              <div className="flex flex-col gap-y-1.5">
                  <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{displayVehicle.passengers || '-'} Penumpang</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <Fuel className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{displayVehicle.fuel || 'Bensin'}</span>
                  </div>
              </div>
               <div className="flex items-center gap-1.5">
                  <Cog className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-right">{availableTransmissionsText}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-end justify-between">
              <div className="flex-shrink-0">
                  {hasDiscount && discountedPrice ? (
                  <>
                      <p className="text-xs text-muted-foreground">{dictionary.vehicleCard.priceStartFrom}</p>
                      <p className="text-base font-bold text-primary leading-tight">{formatCurrency(discountedPrice)}<span className="text-xs font-normal">/{dictionary.vehicleCard.day}</span></p>
                  </>
                  ) : (
                  <>
                      <p className="text-xs text-muted-foreground">{dictionary.vehicleCard.priceStartFrom}</p>
                      <p className="text-base font-bold text-primary leading-tight">{formatCurrency(displayVehicle.price || 0)}<span className="text-xs font-normal">/{dictionary.vehicleCard.day}</span></p>
                  </>
                  )}
              </div>
              {isOutOfStock ? (
                <Button size="sm" disabled>{dictionary.vehicleCard.outOfStock}</Button>
              ) : (
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="sm" className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">{dictionary.vehicleCard.book}</Button>
                    </SheetTrigger>
                    <SheetContent className="p-0 flex flex-col">
                        <OrderForm variants={vehicle.variants || [displayVehicle]} />
                    </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
      </Card>
  );
}
