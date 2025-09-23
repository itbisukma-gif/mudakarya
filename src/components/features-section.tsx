'use client'

import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { FeatureItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';


export function FeaturesSection() {
    const [features, setFeatures] = useState<FeatureItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        const fetchFeatures = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('features').select('*').order('created_at');
            if (data && data.length > 0) {
                setFeatures(data);
                setExpandedId(data[0].id); // Expand the first item by default
            }
            setIsLoading(false);
        };
        fetchFeatures();
    }, [supabase]);

    if (isLoading) {
        return (
             <section className="bg-muted/50 py-12 md:py-20">
                <div className="container text-center">
                     <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Memuat Keunggulan Layanan...</span>
                    </div>
                </div>
            </section>
        )
    }

    if (features.length === 0) return null;

    return (
        <section className="bg-muted/50 py-12 md:py-20">
            <div className="container">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Keunggulan Layanan Kami</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Kami berkomitmen untuk memberikan pengalaman sewa mobil terbaik untuk Anda.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 h-[350px] md:h-[400px]">
                    {features.map((feature) => {
                        const isExpanded = expandedId === feature.id;
                        return (
                             <div
                                key={feature.id}
                                onClick={() => setExpandedId(feature.id)}
                                data-expanded={isExpanded}
                                className={cn(
                                    "relative rounded-xl overflow-hidden cursor-pointer shadow-lg transition-[flex-grow] duration-500 ease-in-out group",
                                    isExpanded ? "flex-grow-[7]" : "flex-grow-[1]"
                                )}
                             >
                                {feature.imageUrl && (
                                    <Image
                                        src={feature.imageUrl}
                                        alt={feature.title}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={feature.dataAiHint || ''}
                                    />
                                )}
                                <div className={cn(
                                    "absolute inset-0 bg-black/60 transition-all duration-500 flex p-4 md:p-6",
                                    isExpanded 
                                        ? "items-end justify-start" 
                                        : "items-center justify-center hover:bg-black/50"
                                )}>
                                    <div className={cn("text-white transition-all duration-500", !isExpanded && "text-center")}>
                                         <h3 className={cn("text-lg font-bold whitespace-nowrap")}>
                                            {feature.title}
                                        </h3>
                                        <div 
                                            className={cn(
                                                "overflow-hidden transition-all duration-300 ease-in-out",
                                                isExpanded ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                                            )}
                                        >
                                            <p className="text-sm text-white/90">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
