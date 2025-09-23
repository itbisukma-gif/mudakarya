
'use server';

import { createServiceRoleClient, uploadImageFromDataUri } from '@/utils/supabase/server';
import type { Promotion } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function upsertPromotion(promoData: Omit<Promotion, 'created_at'>) {
    const supabase = createServiceRoleClient();
    
    try {
        if (promoData.imageUrl && promoData.imageUrl.startsWith('data:image')) {
            promoData.imageUrl = await uploadImageFromDataUri(promoData.imageUrl, 'promotions', `promo-${promoData.id}`);
        }
    } catch (uploadError) {
        console.error("Promotion image upload failed:", uploadError);
        return { data: null, error: { message: (uploadError as Error).message } };
    }
    
    const { data, error } = await supabase.from('promotions').upsert(promoData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting promotion:', error);
        return { data: null, error };
    }

    revalidatePath('/dashboard/promosi');
    return { data, error: null };
}

export async function deletePromotion(promoId: string) {
    const supabase = createServiceRoleClient();

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
    return { error: null };
}
