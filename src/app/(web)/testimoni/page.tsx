
'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect } from "react";
import type { Testimonial, GalleryItem } from "@/lib/types";
import { createClient } from '@/utils/supabase/client';
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from '@supabase/supabase-js';
import { StarRating } from "@/components/star-rating";
import { FeaturesSection } from "@/components/features-section";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export const dynamic = 'force-dynamic';

function TestimonialsPageContent() {
    const { dictionary } = useLanguage();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        
        const fetchData = async () => {
            setIsLoading(true);
            const { data: testimonialsData, error: testimonialsError } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
            const { data: galleryData, error: galleryError } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });

            if (testimonialsError) toast({ variant: 'destructive', title: 'Gagal memuat testimoni', description: testimonialsError.message });
            else setTestimonials(testimonialsData || []);

            if (galleryError) toast({ variant: 'destructive', title: 'Gagal memuat galeri', description: galleryError.message });
            else setGallery(galleryData || []);

            setIsLoading(false);
        };
        fetchData();
    }, [toast, supabase]);

    return (
        <>
            <div className="container py-8 md:py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight">{dictionary.testimonials.title}</h1>
                    <p className="mt-4 text-lg text-muted-foreground">{dictionary.testimonials.description}</p>
                </div>

                <Tabs defaultValue="comments" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="comments">{dictionary.testimonials.tabs.reviews}</TabsTrigger>
                        <TabsTrigger value="gallery">{dictionary.testimonials.tabs.gallery}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="mt-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : testimonials.length > 0 ? (
                            <div className="space-y-6">
                                {testimonials.map((item) => (
                                    <Card key={item.id}>
                                        <CardHeader>
                                            <div className="flex items-start gap-4">
                                                <UserCircle className="h-12 w-12 text-muted-foreground flex-shrink-0" />
                                                <div className="w-full">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div>
                                                            <h3 className="font-semibold text-lg">{item.customerName}</h3>
                                                            {item.vehicleName && (
                                                                <p className="text-sm text-muted-foreground">{dictionary.testimonials.rented} {item.vehicleName}</p>
                                                            )}
                                                        </div>
                                                        <StarRating rating={item.rating} />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground pl-16 italic">"{item.comment}"</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-16 text-muted-foreground">
                                <p>Belum ada testimoni.</p>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="gallery" className="mt-8">
                         {isLoading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : gallery.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {gallery.map((photo) => (
                                    <Dialog key={photo.id}>
                                        <DialogTrigger asChild>
                                            <div className="relative group aspect-square cursor-pointer">
                                                <Image
                                                    src={photo.url}
                                                    alt={dictionary.testimonials.galleryAlt}
                                                    fill
                                                    className="object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                                                    data-ai-hint="customer photo"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                    <p className="text-white text-center text-sm p-2">{photo.vehicleName || dictionary.testimonials.galleryHover}</p>
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl">
                                             <DialogHeader>
                                                <DialogTitle>Pratinjau Gambar</DialogTitle>
                                                <DialogDescription>
                                                    {photo.vehicleName || "Momen pelanggan bersama MudaKarya RentCar"}
                                                </DialogDescription>
                                             </DialogHeader>
                                             <div className="relative aspect-[4/3]">
                                                <Image
                                                    src={photo.url}
                                                    alt={dictionary.testimonials.galleryAlt}
                                                    fill
                                                    className="object-contain rounded-lg"
                                                />
                                             </div>
                                        </DialogContent>
                                    </Dialog>
                                ))}
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-80 text-muted-foreground text-center">
                                <ImageIcon className="h-12 w-12 mb-4" />
                                <p className="text-sm font-medium">Belum ada foto di galeri.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
            <FeaturesSection />
        </>
    )
}

export default function TestimonialsPage() {
    return (
        <TestimonialsPageContent />
    )
}
