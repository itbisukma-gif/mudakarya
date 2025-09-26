'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { ContactInfo } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from './icons';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export function WhatsappFab() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const { dictionary } = useLanguage();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const supabaseClient = createClient();
    setSupabase(supabaseClient);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const fetchContactInfo = async () => {
        const { data } = await supabase.from('contact_info').select('whatsapp').single();
        setContactInfo(data as ContactInfo);
    };
    fetchContactInfo();
  }, [supabase]);

  if (!contactInfo || !contactInfo.whatsapp) {
    return null;
  }

  const formatWhatsappUrl = (phone: string | null | undefined): string => {
    if (!phone) return '#';
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone;
    }
    return `https://wa.me/${formattedPhone}`;
  };

  const whatsappUrl = formatWhatsappUrl(contactInfo.whatsapp);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button
              size="icon"
              className={cn(
                "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-green-500 hover:bg-green-600 text-white",
                "md:bottom-6 mb-16 md:mb-0" 
              )}
              aria-label={dictionary.contact.contactWhatsApp}
            >
              <WhatsAppIcon className="h-7 w-7" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-foreground text-background">
          <p>{dictionary.contact.contactWhatsApp}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
