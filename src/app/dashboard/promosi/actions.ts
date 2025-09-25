
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Promotion, Vehicle } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function upsertPromotion(promoData: Omit<Promotion, 'created_at'>, discount: number | null | undefined, allVariants: Vehicle[]) {
    const supabase = createServiceRoleClient();
    
    // 1. Upsert the promotion itself
    const { data: savedPromo, error: promoError } = await supabase.from('promotions').upsert(promoData, { onConflict: 'id' }).select().single();
    if (promoError) {
        console.error('Error upserting promotion:', promoError);
        return { data: null, error: promoError };
    }

    // 2. Find the vehicle that was originally linked to get its brand and name
    const sourceVehicle = allVariants.find(v => v.id === promoData.vehicleId);

    if (sourceVehicle) {
        // 3. Find all variants of this vehicle model
        const variantsToUpdate = allVariants.filter(v => v.brand === sourceVehicle.brand && v.name === sourceVehicle.name);
        
        // 4. Create an array of upsert promises for all variants
        const updatePromises = variantsToUpdate.map(variant => 
            supabase.from('vehicles').update({ discountPercentage: discount || null }).eq('id', variant.id)
        );

        const results = await Promise.all(updatePromises);
        const firstError = results.find(res => res.error);

        if (firstError) {
            console.error('Error updating one or more vehicle variants with discount:', firstError.error);
            // Even if discount application fails, we still return the saved promo data but with a warning.
            // The primary action (saving promo) was successful.
            return { data: savedPromo, error: firstError.error };
        }
    }
    
    // 5. Handle removal of discount from a previously linked vehicle if the link has changed
    const oldPromo = await supabase.from('promotions').select('vehicleId').eq('id', promoData.id).single();
    if (oldPromo.data?.vehicleId && oldPromo.data.vehicleId !== promoData.vehicleId) {
        const oldVehicle = allVariants.find(v => v.id === oldPromo.data!.vehicleId);
        if (oldVehicle) {
            const oldVariantsToClear = allVariants.filter(v => v.brand === oldVehicle.brand && v.name === oldVehicle.name);
            const clearPromises = oldVariantsToClear.map(variant => 
                supabase.from('vehicles').update({ discountPercentage: null }).eq('id', variant.id)
            );
            await Promise.all(clearPromises);
        }
    }


    revalidatePath('/dashboard/promosi');
    revalidatePath('/dashboard/armada');
    revalidatePath('/');
    return { data: savedPromo, error: null };
}

export async function deletePromotion(promo: Promotion, allVariants: Vehicle[]) {
    const supabase = createServiceRoleClient();

    // 1. Delete from promotions table
    const { error: deleteError } = await supabase.from('promotions').delete().eq('id', promo.id);
    if (deleteError) {
        console.error('Error deleting promotion:', deleteError);
        return { error: deleteError };
    }

    // 2. If the promotion had a linked vehicle, remove the discount from all its variants
    if (promo.vehicleId) {
        const sourceVehicle = allVariants.find(v => v.id === promo.vehicleId);
        if (sourceVehicle) {
            const variantsToClear = allVariants.filter(v => v.brand === sourceVehicle.brand && v.name === sourceVehicle.name);
            const clearPromises = variantsToClear.map(variant => 
                supabase.from('vehicles').update({ discountPercentage: null }).eq('id', variant.id)
            );
            await Promise.all(clearPromises);
        }
    }
    
    // 3. Delete the image from storage
    if (promo.imageUrl) {
        const bucketName = 'mudakarya-bucket';
        try {
            const filePath = promo.imageUrl.substring(promo.imageUrl.indexOf(bucketName) + bucketName.length + 1);
            await supabase.storage.from(bucketName).remove([filePath]);
        } catch (storageError) {
            console.error('Failed to delete promo image from storage, but DB entry was removed:', storageError);
            // We don't return an error here because the main deletion was successful.
        }
    }
    
    revalidatePath('/dashboard/promosi');
    revalidatePath('/dashboard/armada');
    revalidatePath('/');
    return { error: null };
}
