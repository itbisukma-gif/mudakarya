'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { ContactInfo } from '@/lib/types';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

function SocialLink({ platform, url }: { platform: string; url: string; }) {
  if (!url) return null;
  
  const iconUrl = `https://cdn.jsdelivr.net/gh/CLorant/readme-social-icons@main/medium/currentColor/${platform}.svg`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
      <div className="relative h-6 w-6">
        <Image src={iconUrl} alt={`${platform} logo`} fill className="object-contain" />
      </div>
    </a>
  );
}


export function WebFooter({ className }: { className?: string }) {
  const pathname = usePathname();
  const { dictionary } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const supabaseClient = createClient();
    setSupabase(supabaseClient);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const fetchContactInfo = async () => {
        const { data } = await supabase.from('contact_info').select('*').single();
        setContactInfo(data);
    };
    fetchContactInfo();
  }, [supabase]);

  const hasSocialMedia = contactInfo && (contactInfo.instagram || contactInfo.facebook || contactInfo.twitter || contactInfo.tiktok || contactInfo.telegram);


  return (
    <div className={className}>
      {/* Mobile Sticky Nav */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <nav className="container flex h-16 items-center justify-around">
          {dictionary.navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </footer>
      {/* Add padding to the bottom of the main content on mobile to prevent overlap */}
      <div className="pb-16 md:pb-0"></div>


      {/* Desktop Footer */}
      <footer className="hidden border-t bg-muted md:block">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                  <Logo className="w-7 h-7 text-primary" />
                  <span className="text-lg font-bold tracking-tight">MudaKarya CarRent</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm">
                  {dictionary.footer.description}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{dictionary.footer.navigation}</h4>
              <ul className="space-y-2 text-sm">
                {dictionary.footer.navLinks.map(link => (
                    <li key={link.href}><Link href={link.href} className="text-muted-foreground hover:text-primary">{link.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{dictionary.footer.contactUs}</h4>
              {contactInfo ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>{contactInfo.address}</li>
                    <li>Email: {contactInfo.email}</li>
                    <li>WhatsApp: {contactInfo.whatsapp}</li>
                </ul>
              ) : (
                 <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>{dictionary.loading}...</li>
                 </ul>
              )}
            </div>
          </div>
           {hasSocialMedia && contactInfo && (
            <div className="mt-8 border-t pt-6">
                <div className="flex justify-center items-center gap-5">
                    <SocialLink platform="instagram" url={contactInfo.instagram!} />
                    <SocialLink platform="facebook" url={contactInfo.facebook!} />
                    <SocialLink platform="twitter" url={contactInfo.twitter!} />
                    <SocialLink platform="tiktok" url={contactInfo.tiktok!} />
                    <SocialLink platform="telegram" url={contactInfo.telegram!} />
                </div>
            </div>
          )}
          <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
              {dictionary.footer.copyright(new Date().getFullYear())}
          </div>
        </div>
      </footer>
    </div>
  );
}
