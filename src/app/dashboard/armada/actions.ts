'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Vehicle } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function upsertVehicle(vehicleData: Vehicle) {
    const supabase = createServiceRoleClient();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };

    // The image URL should already be a public Supabase URL, no upload logic here.
    const { data, error } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { onConflict: 'id' })
        .select()
        .single();
    
    if (error) {
        console.error('Error upserting vehicle:', error);
        return { data: null, error };
    }
    
    revalidatePath('/dashboard/armada');
    return { data, error: null };
}

export async function deleteVehicle(vehicleId: string) {
    const supabase = createServiceRoleClient();
    if (!supabase) return { error: { message: "Supabase client not available." } };
    
    const { data: itemData, error: fetchError } = await supabase.from('vehicles').select('photo').eq('id', vehicleId).single();
    if (fetchError) {
        console.error("Error fetching vehicle for deletion:", fetchError);
        return { error: fetchError };
    }
    
    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
    
    if (error) {
        console.error('Error deleting vehicle:', error);
        return { error };
    }

    if(itemData.photo) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.photo.substring(itemData.photo.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }

    revalidatePath('/dashboard/armada');
    return { error: null };
}

export async function updateVehicleStatus(vehicleId: string, status: 'tersedia' | 'dipesan' | 'disewa') {
    const supabase = createServiceRoleClient();
    if (!supabase) return { error: { message: "Supabase client not available." } };

    const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId);
    
    if (error) {
        console.error('Error updating vehicle status:', error);
        return { error };
    }

    revalidatePath('/dashboard/armada');
    revalidatePath('/dashboard/orders');
    return { error: null };
}
