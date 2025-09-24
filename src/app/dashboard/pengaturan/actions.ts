
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { ContactInfo, TermsContent } from "@/lib/types";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase() {
    if (!supabase) {
        try {
            supabase = createServiceRoleClient();
        } catch (e) {
            console.log('Supabase client could not be created, likely during build time.');
            return null;
        }
    }
    return supabase;
}

// Server Actions
export async function updateContactInfo(data: ContactInfo) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Supabase client not available." } };

    const { error } = await supabase.from('contact_info').update(data).eq('id', 1);
    if(error) return {error};
    revalidatePath('/dashboard/pengaturan');
    revalidatePath('/kontak');
    return { error: null };
}

export async function updateTermsContent(data: TermsContent) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Supabase client not available." } };

    const { error } = await supabase.from('terms_content').update(data).eq('id', 1);
    if(error) return {error};
    revalidatePath('/dashboard/pengaturan');
    revalidatePath('/syarat-ketentuan');
    return { error: null };
}
