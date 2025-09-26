

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect } from "react";
import type { TermsContent } from "@/lib/types";
import { createClient } from '@/utils/supabase/client';
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from '@supabase/supabase-js';

function TermsPageContent() {
    const { dictionary } = useLanguage();
    const { toast } = useToast();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [termsContent, setTermsContent] = useState<TermsContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);
    }, []);

    useEffect(() => {
        if (!supabase) return;

        const fetchTerms = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('terms_content').select('*').single();
            if (error || !data) {
                toast({ variant: 'destructive', title: dictionary.errors.failedToLoad('syarat & ketentuan'), description: error?.message });
            } else {
                setTermsContent(data);
            }
            setIsLoading(false);
        };
        fetchTerms();
    }, [toast, supabase, dictionary]);

    if (isLoading) {
        return (
             <div className="container py-16 text-center flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {dictionary.loading}...
            </div>
        )
    }

    if (!termsContent) {
        return <div className="container py-16 text-center">{dictionary.errors.failedToLoad('syarat & ketentuan')}</div>
    }

    const generalTermsList = termsContent.general?.split('\n').filter(line => line.trim() !== '') || [];
    const paymentMethodsList = termsContent.payment?.split('\n').filter(line => line.trim() !== '') || [];

    return (
            <div className="bg-muted/30">
                <div className="container py-8 md:py-16">
                     <div className="text-center mb-12 max-w-2xl mx-auto">
                        <h1 className="text-4xl font-bold tracking-tight">{dictionary.terms.title}</h1>
                        <p className="mt-4 text-lg text-muted-foreground">{dictionary.terms.description}</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>{dictionary.terms.general.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {generalTermsList.map((term: string, index: number) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{term}</span>
                                    </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>{dictionary.terms.payment.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">{dictionary.terms.payment.description}</p>
                                <ul className="list-disc list-inside space-y-2">
                                    {paymentMethodsList.map((method: string, index: number) => (
                                        <li key={index}>{method}</li>
                                    ))}
                                </ul>
                                <p className="text-sm text-muted-foreground mt-6">{dictionary.terms.payment.downPayment}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
    )
}

export default function TermsPage() {
    return (
        <TermsPageContent />
    )
}
