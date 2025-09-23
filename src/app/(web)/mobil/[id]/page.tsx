

'use client'

import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCircle, Tag, Cog, Users, Fuel, Calendar, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Vehicle, Testimonial, GalleryItem } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { VehicleCard } from '@/components/vehicle-card';
import { useRef, useState, useEffect, useMemo } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { StarRating } from '@/components/star-rating';
import { useLanguage } from '@/hooks/use-language';
import { OrderForm } from '@/components/order-form';
import { Separator } from '@/components/ui/separator';
import { useVehicleLogo } from '@/hooks/use-vehicle-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { upsertTestimonial } from '@/app/dashboard/testimoni/actions';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function VehicleDetail() {
  const params = useParams();
  const { dictionary } = useLanguage();
  const { toast } = useToast();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [variants, setVariants] = useState<Vehicle[]>([]);
  const [otherVehicles, setOtherVehicles] = useState<Vehicle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
  
  const representativeVehicle = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    // Find the vehicle with the lowest price in the group to be the representative
    return variants.reduce((lowest, current) => {
        const lowestPrice = lowest.discountPercentage ? (lowest.price! * (1 - lowest.discountPercentage / 100)) : lowest.price;
        const currentPrice = current.discountPercentage ? (current.price! * (1 - current.discountPercentage / 100)) : current.price;
        return lowestPrice! < currentPrice! ? lowest : current;
    });
  }, [variants]);

  const { logoUrl } = useVehicleLogo(representativeVehicle ? representativeVehicle.brand : '');
  
  const availableTransmissionsText = useMemo(() => {
    if (!variants || variants.length === 0) return '-';
    const transmissionTypes = new Set(variants.map(v => v.transmission));
    return Array.from(transmissionTypes).join(' | ');
  }, [variants]);
  
  useEffect(() => {
    const supabaseClient = createClient();
    setSupabase(supabaseClient);
  }, []);
  
  useEffect(() => {
    if (!supabase) return;

    const vehicleId = params.id as string;
    if (!vehicleId) return;

    const fetchData = async () => {
        setIsLoading(true);
        
        // Fetch current vehicle
        const { data: vehicleData, error: vehicleError } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
        if (vehicleError || !vehicleData) {
            console.error('Error fetching vehicle', vehicleError);
            notFound();
            return;
        }
        setVehicle(vehicleData);

        // Fetch variants (same brand and name)
        const { data: variantData } = await supabase
            .from('vehicles')
            .select('*')
            .eq('brand', vehicleData.brand)
            .eq('name', vehicleData.name);
        setVariants(variantData || []);

        // Fetch other vehicles (different name)
        const { data: otherVehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .neq('brand', vehicleData.brand)
          .neq('name', vehicleData.name)
          .limit(6);
        setOtherVehicles(otherVehiclesData || []);

        const vehicleFullName = `${vehicleData.brand} ${vehicleData.name}`;

        // Fetch testimonials for this vehicle model (brand and name)
        const { data: testimonialsData } = await supabase.from('testimonials').select('*').eq('vehicleName', vehicleFullName);
        setTestimonials(testimonialsData || []);

        // Fetch gallery for this vehicle model (brand and name)
        const { data: galleryData } = await supabase.from('gallery').select('*').eq('vehicleName', vehicleFullName);
        setGallery(galleryData || []);

        setIsLoading(false);
    };

    fetchData();
  }, [params.id, supabase]);

  const handleSubmitReview = async () => {
      if (userRating === 0 || !userComment.trim() || !vehicle) {
          toast({ variant: 'destructive', title: 'Form Tidak Lengkap', description: 'Mohon berikan rating dan komentar.' });
          return;
      }
      setIsSubmittingReview(true);
      const newTestimonial: Omit<Testimonial, 'created_at'> = {
          id: crypto.randomUUID(),
          customerName: "Pelanggan Anonim", // or get from logged in user
          vehicleName: `${vehicle.brand} ${vehicle.name}`,
          rating: userRating,
          comment: userComment,
      };
      const result = await upsertTestimonial(newTestimonial);
      if (result.error) {
          toast({ variant: 'destructive', title: 'Gagal Mengirim Ulasan', description: result.error.message });
      } else {
          toast({ title: 'Ulasan Terkirim', description: 'Terima kasih atas masukan Anda!' });
          if (result.data) {
             setTestimonials(prev => [result.data!, ...prev]);
          }
          setUserRating(0);
          setUserComment("");
      }
      setIsSubmittingReview(false);
  }

  if (isLoading || !representativeVehicle) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
  
  const hasDiscount = representativeVehicle.discountPercentage && representativeVehicle.discountPercentage > 0;
  const discountedPrice = (hasDiscount && representativeVehicle.price && representativeVehicle.discountPercentage)
    ? representativeVehicle.price * (1 - representativeVehicle.discountPercentage / 100)
    : representativeVehicle.price;

  const vehicleDetails = [
    { label: dictionary.vehicleDetail.details.brand, value: representativeVehicle.brand, icon: CheckCircle },
    { label: dictionary.vehicleDetail.details.type, value: representativeVehicle.type || '-', icon: CheckCircle },
    { label: dictionary.vehicleDetail.details.transmission, value: availableTransmissionsText, icon: Cog },
    { label: dictionary.vehicleDetail.details.fuel, value: representativeVehicle.fuel || '-', icon: Fuel },
    { label: dictionary.vehicleDetail.details.capacity, value: representativeVehicle.passengers ? `${representativeVehicle.passengers} ${dictionary.vehicleDetail.details.passenger}` : '-', icon: Users },
    { label: dictionary.vehicleDetail.details.year, value: representativeVehicle.year, icon: Calendar },
  ];

  return (
    <div className="container py-6 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative">
           <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md">
            <Image 
                src={representativeVehicle.photo!} 
                alt={`${representativeVehicle.brand} ${representativeVehicle.name}`} 
                fill 
                className="object-cover" 
                data-ai-hint={representativeVehicle.dataAiHint || ''}
            />
             {logoUrl && (
                <div className="absolute top-3 left-3 bg-white/70 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                    <div className="relative h-8 w-12">
                        <Image
                            src={logoUrl}
                            alt={`${representativeVehicle.brand} logo`}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
          </div>
           {hasDiscount && (
            <Badge variant="destructive" className="absolute top-3 right-3 text-sm py-1 px-2 shadow-lg">
              <Tag className="h-4 w-4 mr-1.5" />
              {representativeVehicle.discountPercentage}% OFF
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">{representativeVehicle.brand} {representativeVehicle.name}</h1>
            <StarRating rating={representativeVehicle.rating || 0} totalReviews={testimonials.length} />
          </div>
          
          <Card>
            <CardHeader className='p-4'>
                <CardTitle className="text-base">{dictionary.vehicleDetail.details.title}</CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0'>
                <ul className="space-y-2.5 text-sm">
                    {vehicleDetails.map(detail => (
                        <li key={detail.label} className="flex items-center gap-3">
                            <detail.icon className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">{detail.label}:</span>
                            <span className="font-medium ml-auto">{detail.value || '-'}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>
          
           <Card className="mt-2">
            <CardContent className="p-4 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{dictionary.vehicleCard.priceStartFrom}</span>
                   {hasDiscount && discountedPrice ? (
                      <div className='text-right'>
                          <p className="text-sm line-through text-muted-foreground">{formatCurrency(representativeVehicle.price || 0)}</p>
                          <p className="text-xl font-bold text-primary">{formatCurrency(discountedPrice)}</p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-primary">{formatCurrency(representativeVehicle.price || 0)}</p>
                  )}
               </div>
               <Separator />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="lg" className="w-full transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">{dictionary.vehicleDetail.bookNow}</Button>
                  </SheetTrigger>
                  <SheetContent className="p-0 flex flex-col">
                    <OrderForm variants={variants} />
                  </SheetContent>
                </Sheet>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-xl font-bold mb-4 text-center">{dictionary.vehicleDetail.reviews.customerReviews}</h2>
        <Tabs defaultValue="reviews" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reviews">{dictionary.vehicleDetail.reviews.customerReviews}</TabsTrigger>
                <TabsTrigger value="gallery">{dictionary.vehicleDetail.reviews.galleryTab}</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="md:col-span-2">
                        <CardContent className="p-0">
                            <ScrollArea className="h-80 w-full">
                               <div className="p-4 space-y-5">
                                 {testimonials.length > 0 ? testimonials.map(t => (
                                   <div key={t.id} className="flex gap-3">
                                       <UserCircle className="h-10 w-10 text-muted-foreground flex-shrink-0 mt-1"/>
                                       <div>
                                           <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold">{t.customerName}</p>
                                                <StarRating rating={t.rating} />
                                           </div>
                                           <p className="text-sm text-muted-foreground italic">"{t.comment}"</p>
                                       </div>
                                   </div>
                                 )) : <p className="text-muted-foreground text-center py-8 text-sm">{dictionary.vehicleDetail.reviews.noReviews}</p>}
                               </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card className="md:col-span-2">
                        <CardHeader className='p-4'>
                            <CardTitle className="text-base">{dictionary.vehicleDetail.reviews.shareExperience}</CardTitle>
                            <CardDescription className="text-sm">{dictionary.vehicleDetail.reviews.formDescription}</CardDescription>
                        </CardHeader>
                            <CardContent className="space-y-4 p-4 pt-0">
                            <Textarea placeholder={dictionary.vehicleDetail.reviews.commentPlaceholder} rows={4} value={userComment} onChange={e => setUserComment(e.target.value)} />
                            <div className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                <p className="font-medium text-sm">{dictionary.vehicleDetail.reviews.yourRating}</p>
                                    <StarRating rating={userRating} onRatingChange={setUserRating} />
                            </div>
                            <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="w-full transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-100">
                                {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {dictionary.vehicleDetail.reviews.submitReview}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="gallery" className="mt-4">
                 <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px] w-full">
                            {gallery.length > 0 ? (
                                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {gallery.map(photo => (
                                         <div key={photo.id} className="relative group aspect-square">
                                            <Image
                                                src={photo.url}
                                                alt={`${dictionary.testimonials.galleryAlt} - ${representativeVehicle.name}`}
                                                fill
                                                className="object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                                                data-ai-hint="customer photo"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-80 text-muted-foreground text-center">
                                    <ImageIcon className="h-12 w-12 mb-4" />
                                    <p className="text-sm font-medium">{dictionary.vehicleDetail.reviews.noPhotos}</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

       <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold tracking-tight text-center mb-6">{dictionary.vehicleDetail.otherRecommendations}</h2>
           <Carousel 
              opts={{ align: "start", loop: true, }}
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              className="w-full"
           >
              <CarouselContent className="-ml-2">
                {otherVehicles.map((v) => (
                  <CarouselItem key={v.id} className="pl-2 basis-4/5 sm:basis-1/2">
                    <div className="p-1 h-full">
                      <VehicleCard vehicle={v} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex"/>
           </Carousel>
       </div>
    </div>
  )
}

export default function MobilDetailPage() {
    return (
        <VehicleDetail />
    );
}

    