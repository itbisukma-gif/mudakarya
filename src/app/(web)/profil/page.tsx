
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building, Target, Eye, Gem, Phone, Mail, Pin, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { ContactInfo } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import Image from 'next/image';

const companyData = {
    history: "Didirikan pada tahun 2024, MudaKarya RentCar lahir dari semangat untuk memberikan solusi mobilitas yang mudah, aman, dan terpercaya. Kami memulai dengan armada sederhana dan tekad kuat untuk menjadi mitra perjalanan terbaik bagi setiap pelanggan, baik untuk kebutuhan bisnis, liburan keluarga, maupun perjalanan personal.",
    vision: "Menjadi perusahaan rental mobil terdepan yang mengutamakan inovasi, kenyamanan, dan kepuasan pelanggan di setiap layanan yang kami berikan.",
    mission: "Menyediakan armada kendaraan yang modern, terawat, dan beragam. Memberikan layanan pelanggan yang ramah, profesional, dan responsif. Mengembangkan solusi teknologi untuk mempermudah proses pemesanan dan pengalaman pelanggan.",
    values: [
        {
            icon: Gem,
            title: "Kualitas",
            description: "Kami hanya menyediakan kendaraan dalam kondisi prima dan layanan terbaik."
        },
        {
            icon: Building,
            title: "Integritas",
            description: "Kejujuran dan transparansi adalah landasan bisnis kami."
        },
        {
            icon: Eye,
            title: "Fokus Pelanggan",
            description: "Kepuasan Anda adalah prioritas utama kami dalam setiap keputusan."
        }
    ]
}


export default function CompanyProfilePage() {
    const { dictionary } = useLanguage();
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        const fetchContact = async () => {
            setIsLoading(true);
            const { data } = await supabase.from('contact_info').select('*').single();
            setContactInfo(data);
            setIsLoading(false);
        }
        fetchContact();
    }, [supabase]);

  return (
    <div className="bg-muted/30">
        <div className="container py-12 md:py-20">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight">Tentang MudaKarya RentCar</h1>
                    <p className="mt-4 text-lg text-muted-foreground">Mengenal Lebih Dekat Mitra Perjalanan Anda</p>
                </div>

                <Card className="mb-8 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                            <Building className="h-6 w-6 text-primary" />
                            <span>Sejarah Kami</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="relative aspect-3/2 w-full md:w-1/3 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src="https://picsum.photos/seed/companyhistory/600/400"
                                    alt="Kantor MudaKarya RentCar"
                                    fill
                                    className="object-cover"
                                    data-ai-hint="office building"
                                />
                            </div>
                            <div className="flex-grow">
                                <p className="text-muted-foreground">{companyData.history}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Eye className="h-6 w-6 text-primary" />
                                <span>Visi</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{companyData.vision}</p>
                        </CardContent>
                    </Card>
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Target className="h-6 w-6 text-primary" />
                                <span>Misi</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{companyData.mission}</p>
                        </CardContent>
                    </Card>
                </div>
                
                 <Card className="mb-8 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Nilai-Nilai Kami</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-3 gap-8 text-center">
                       {companyData.values.map(value => {
                           const Icon = value.icon;
                           return (
                             <div key={value.title} className="flex flex-col items-center">
                                <Icon className="h-10 w-10 text-primary mb-4" />
                                <h3 className="font-semibold text-lg">{value.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{value.description}</p>
                            </div>
                           )
                       })}
                    </CardContent>
                </Card>

                 <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Informasi Kontak</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-24">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : contactInfo ? (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Pin className="h-8 w-8 text-primary" />
                                    <h3 className="font-semibold">{dictionary.contact.officeAddress}</h3>
                                    <p className="text-muted-foreground text-sm">{contactInfo.address}</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <Mail className="h-8 w-8 text-primary" />
                                    <h3 className="font-semibold">{dictionary.contact.email}</h3>
                                    <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground text-sm hover:text-primary">{contactInfo.email}</a>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <Phone className="h-8 w-8 text-primary" />
                                    <h3 className="font-semibold">{dictionary.contact.phone}</h3>
                                    <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground text-sm hover:text-primary">{contactInfo.whatsapp}</a>
                                </div>
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground">Gagal memuat informasi kontak.</p>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    </div>
  );
}
