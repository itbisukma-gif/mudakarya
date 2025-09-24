
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { ContactInfo, TermsContent } from "@/lib/types";
import { revalidatePath } from "next/cache";

// Server Actions
export async function updateContactInfo(data: ContactInfo) {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('contact_info').update(data).eq('id', 1);
    if(error) return {error};
    revalidatePath('/dashboard/pengaturan');
    revalidatePath('/kontak');
    return { error: null };
}

export async function updateTermsContent(data: TermsContent) {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('terms_content').update(data).eq('id', 1);
    if(error) return {error};
    revalidatePath('/dashboard/pengaturan');
    revalidatePath('/syarat-ketentuan');
    return { error: null };
}
