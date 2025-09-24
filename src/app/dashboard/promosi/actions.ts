
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Promotion } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function upsertPromotion(promoData: Omit<Promotion, 'created_at'>) {
    const supabase = createServiceRoleClient();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };
    
    // The image URL should already be a public Supabase URL, no upload logic here.
    const { data, error } = await supabase.from('promotions').upsert(promoData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting promotion:', error);
        return { data: null, error };
    }

    revalidatePath('/dashboard/promosi');
    revalidatePath('/');
    return { data, error: null };
}

export async function deletePromotion(promoId: string) {
    const supabase = createServiceRoleClient();
    if (!supabase) return { error: { message: "Supabase client not available." } };

    const { data: itemData, error: fetchError } = await supabase.from('promotions').select('imageUrl').eq('id', promoId).single();
    if (fetchError) {
        console.error("Error fetching promotion for deletion:", fetchError);
        return { error: fetchError };
    }

    const { error } = await supabase.from('promotions').delete().eq('id', promoId);
    if (error) {
        console.error('Error deleting promotion:', error);
        return { error };
    }

    if(itemData.imageUrl) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.imageUrl.substring(itemData.imageUrl.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }
    
    revalidatePath('/dashboard/promosi');
    revalidatePath('/');
    return { error: null };
}
