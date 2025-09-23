'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useTransition } from "react";
import type { ContactInfo, TermsContent } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const socialPlatforms = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter (X)' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'telegram', label: 'Telegram' },
] as const;

type SocialPlatformKey = typeof socialPlatforms[number]['value'];

type SocialLinkItem = {
    platform: SocialPlatformKey;
    url: string;
}

// Server Actions
async function updateContactInfo(data: ContactInfo) {
    const supabase = createClient();
    const { error } = await supabase.from('contact_info').update(data).eq('id', 1);
    return { error };
}

async function updateTermsContent(data: TermsContent) {
    const supabase = createClient();
    const { error } = await supabase.from('terms_content').update(data).eq('id', 1);
    return { error };
}


export default function PengaturanPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startSavingTransition] = useTransition();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [terms, setTerms] = useState<TermsContent | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);

  useEffect(() => {
    const supabaseClient = createClient();
    setSupabase(supabaseClient);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const fetchData = async () => {
        setIsLoading(true);
        const { data: contactData, error: contactError } = await supabase.from('contact_info').select('*').single();
        const { data: termsData, error: termsError } = await supabase.from('terms_content').select('*').single();

        if (contactError || termsError) {
            toast({ variant: 'destructive', title: 'Gagal memuat data pengaturan', description: contactError?.message || termsError?.message });
        } else {
            setContactInfo(contactData);
            setTerms(termsData);
            if (contactData) {
                setSocialLinks(
                    socialPlatforms
                        .map(p => ({ platform: p.value, url: contactData[p.value] || '' }))
                        .filter(item => item.url)
                );
            }
        }
        setIsLoading(false);
    }
    fetchData();
  }, [toast, supabase]);
   
   const handleContactChange = (field: keyof Omit<ContactInfo, SocialPlatformKey>, value: string) => {
    setContactInfo(prev => prev ? ({ ...prev, [field]: value }) : null);
   }
   
    const handleTermsChange = (field: keyof TermsContent, value: string) => {
    setTerms(prev => prev ? ({ ...prev, [field]: value }) : null);
   }
   
   const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
       const newLinks = [...socialLinks];
       // @ts-ignore
       newLinks[index][field] = value;
       setSocialLinks(newLinks);
   }

   const addSocialLink = () => {
       setSocialLinks([...socialLinks, { platform: 'instagram', url: '' }]);
   }
   
   const removeSocialLink = (index: number) => {
       setSocialLinks(socialLinks.filter((_, i) => i !== index));
   }

  const handleSaveChanges = (type: 'Kontak' | 'S&K') => {
    startSavingTransition(async () => {
        if (type === 'Kontak' && contactInfo) {
            const newContactInfo: Partial<ContactInfo> = { ...contactInfo };
            // Reset all social fields first
            socialPlatforms.forEach(p => newContactInfo[p.value] = undefined);
            // Then populate from the socialLinks array
            socialLinks.forEach(link => {
                if (link.platform && link.url) {
                    newContactInfo[link.platform] = link.url;
                }
            });
            
            const { error } = await updateContactInfo(newContactInfo as ContactInfo);
            if (error) {
                toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: error.message });
                return;
            }
        } else if (type === 'S&K' && terms) {
             const { error } = await updateTermsContent(terms);
            if (error) {
                toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: error.message });
                return;
            }
        }
        
        toast({
            title: "Perubahan Disimpan",
            description: `Informasi ${type} telah berhasil diperbarui.`
        });
    });
  }

  if (isLoading || !contactInfo || !terms) {
      return (
        <div className="flex flex-col gap-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
                <p className="text-muted-foreground">Kelola informasi website dan akun Anda.</p>
            </div>
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola informasi website dan akun Anda.
        </p>
      </div>

      <Tabs defaultValue="kontak" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="kontak">Kontak & Media Sosial</TabsTrigger>
            <TabsTrigger value="sk">Syarat & Ketentuan</TabsTrigger>
        </TabsList>
        <TabsContent value="kontak" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Kontak & Alamat</CardTitle>
                    <CardDescription>Perbarui detail yang ditampilkan di halaman Kontak.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="address">Alamat Kantor</Label>
                        <Input id="address" value={contactInfo.address} onChange={(e) => handleContactChange('address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={contactInfo.email} onChange={(e) => handleContactChange('email', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input id="whatsapp" value={contactInfo.whatsapp} onChange={(e) => handleContactChange('whatsapp', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maps">Embed URL Google Maps</Label>
                        <Textarea 
                            id="maps" 
                            rows={4} 
                            value={contactInfo.maps} 
                            onChange={(e) => handleContactChange('maps', e.target.value)}
                            placeholder="Contoh: https://www.google.com/maps/embed?pb=..."
                        />
                         <p className="text-xs text-muted-foreground">{'Buka Google Maps > Cari lokasi > Share > Pilih tab \'Embed a map\' > Salin HANYA URL (src) dari dalam kode iframe.'}</p>
                    </div>
                     {contactInfo.maps && contactInfo.maps.startsWith('https://') && (
                        <div className="space-y-2">
                            <Label>Pratinjau Peta</Label>
                            <div className="aspect-video w-full overflow-hidden rounded-lg border">
                                <iframe
                                    key={contactInfo.maps} // Re-render iframe when URL changes
                                    src={contactInfo.maps}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Tautan Media Sosial</CardTitle>
                    <CardDescription>Kelola tautan profil media sosial Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Select
                                value={link.platform}
                                onValueChange={(value) => handleSocialLinkChange(index, 'platform', value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Pilih Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    {socialPlatforms.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input 
                                value={link.url}
                                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                placeholder="https://..."
                                className="flex-grow"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeSocialLink(index)} aria-label="Hapus tautan">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                     <Button variant="outline" size="sm" onClick={addSocialLink} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Tautan
                    </Button>
                </CardContent>
            </Card>
            <Button onClick={() => handleSaveChanges('Kontak')} className="mt-6" disabled={isSaving}>
                 {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan Kontak & Medsos
            </Button>
        </TabsContent>
        <TabsContent value="sk" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Syarat & Ketentuan</CardTitle>
                    <CardDescription>Atur poin-poin syarat dan ketentuan sewa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Persyaratan Umum</Label>
                        <Textarea rows={8} value={terms.general} onChange={(e) => handleTermsChange('general', e.target.value)} />
                        <p className="text-xs text-muted-foreground">Setiap baris akan menjadi satu poin persyaratan.</p>
                    </div>
                     <div className="space-y-2">
                        <Label>Metode Pembayaran</Label>
                         <Textarea rows={4} value={terms.payment} onChange={(e) => handleTermsChange('payment', e.target.value)} />
                        <p className="text-xs text-muted-foreground">Setiap baris akan menjadi satu poin metode pembayaran.</p>
                    </div>
                    <Button onClick={() => handleSaveChanges('S&K')} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan S&K
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
