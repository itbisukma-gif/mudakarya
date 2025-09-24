

'use client';

import { Button } from "@/components/ui/button";
import { Mail, Phone, Pin, Navigation, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect } from "react";
import type { ContactInfo } from "@/lib/types";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons";
import { createClient } from '@/utils/supabase/client';
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function SocialButton({ platform, url }: { platform: string; url: string; }) {
  if (!url) return null;
  
  const iconUrl = `https://cdn.jsdelivr.net/gh/CLorant/readme-social-icons@main/medium/currentColor/${platform}.svg`;

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group rounded-full p-3 transition-all duration-300 ease-in-out hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Kunjungi kami di ${platform}`}
    >
        <div 
            className="relative h-7 w-7 transform transition-all duration-300 ease-in-out group-hover:scale-110"
        >
            <Image 
                src={iconUrl} 
                alt={`${platform} logo`} 
                fill 
                className="object-contain" 
            />
        </div>
    </a>
  );
}


function KontakPageContent() {
    const { dictionary } = useLanguage();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        
        const fetchContactInfo = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('contact_info').select('*').single();
            if (error || !data) {
                toast({ variant: 'destructive', title: 'Gagal memuat informasi kontak.', description: error?.message });
            } else {
                setContactInfo(data);
            }
            setIsLoading(false);
        };
        fetchContactInfo();
    }, [toast, supabase]);

    if (isLoading) {
        return (
            <div className="container py-16 text-center flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {dictionary.loading}...
            </div>
        )
    }

    if (!contactInfo) {
        return <div className="container py-16 text-center">Gagal memuat informasi kontak.</div>
    }

    const hasSocialMedia = contactInfo.instagram || contactInfo.facebook || contactInfo.twitter || contactInfo.tiktok || contactInfo.telegram;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`;


    return (
            <div className="container py-8 md:py-16">
                 <div className="text-center mb-12 max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold tracking-tight">{dictionary.contact.title}</h1>
                    <p className="mt-4 text-lg text-muted-foreground">{dictionary.contact.description}</p>
                </div>

                <div className="max-w-4xl mx-auto">

                    {/* Google Maps */}
                    <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                        <iframe
                            src={contactInfo.maps}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={dictionary.contact.mapTitle}
                        ></iframe>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center mb-8">
                         <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="lg">
                                <Navigation className="mr-2 h-4 w-4" />
                                {dictionary.contact.getDirections}
                            </Button>
                        </a>
                         <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="lg">
                                 <WhatsAppIcon className="mr-2 h-4 w-4" />
                                {dictionary.contact.contactWhatsApp}
                            </Button>
                        </a>
                    </div>
                    
                    {/* Simplified Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center pt-8 border-t">
                        <div className="flex flex-col items-center gap-2">
                            <Pin className="h-10 w-10 text-primary" />
                            <h3 className="font-semibold text-lg">{dictionary.contact.officeAddress}</h3>
                            <p className="text-muted-foreground text-sm">{contactInfo.address}</p>
                        </div>
                         <div className="flex flex-col items-center gap-2">
                            <Mail className="h-10 w-10 text-primary" />
                            <h3 className="font-semibold text-lg">{dictionary.contact.email}</h3>
                             <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground text-sm hover:text-primary">{contactInfo.email}</a>
                        </div>
                         <div className="flex flex-col items-center gap-2">
                            <Phone className="h-10 w-10 text-primary" />
                            <h3 className="font-semibold text-lg">{dictionary.contact.phone}</h3>
                            <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground text-sm hover:text-primary">{contactInfo.whatsapp}</a>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    {hasSocialMedia && (
                        <div className="pt-10 mt-10 border-t">
                             <h3 className="text-center text-lg font-semibold mb-6">{dictionary.contact.socialMedia.title}</h3>
                             <div className="flex flex-row justify-center items-center gap-4">
                                <SocialButton platform="instagram" url={contactInfo.instagram!} />
                                <SocialButton platform="facebook" url={contactInfo.facebook!} />
                                <SocialButton platform="twitter" url={contactInfo.twitter!} />
                                <SocialButton platform="tiktok" url={contactInfo.tiktok!} />
                                <SocialButton platform="telegram" url={contactInfo.telegram!} />
                             </div>
                        </div>
                    )}

                </div>
            </div>
    )
}

export default function KontakPage() {
    return (
        <KontakPageContent />
    )
}
