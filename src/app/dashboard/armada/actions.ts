
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Vehicle } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function upsertVehicle(vehicleData: Vehicle) {
    const supabase = createServiceRoleClient();

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

export async function adjustVehicleStock(vehicleId: string, adjustment: number) {
    const supabase = createServiceRoleClient();
    
    const { data: vehicle, error: fetchError } = await supabase.from('vehicles').select('stock').eq('id', vehicleId).single();

    if (fetchError || !vehicle) {
        console.error('Error fetching vehicle for stock adjustment:', fetchError);
        return { error: fetchError || new Error('Vehicle not found') };
    }
    
    const currentStock = vehicle.stock || 0;
    const newStock = Math.max(0, currentStock + adjustment); // Ensure stock doesn't go below 0

    const { error: updateError } = await supabase
        .from('vehicles')
        .update({ stock: newStock })
        .eq('id', vehicleId);

    if (updateError) {
        console.error('Error adjusting vehicle stock:', updateError);
        return { error: updateError };
    }
    
    revalidatePath('/dashboard/armada');
    revalidatePath('/dashboard/orders');
    revalidatePath('/'); // Revalidate homepage to show updated stock
    return { error: null };
}
