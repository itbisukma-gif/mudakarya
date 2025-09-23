
'use server';

import { createServiceRoleClient, uploadImageFromDataUri } from '@/utils/supabase/server';
import type { Vehicle } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function upsertVehicle(vehicleData: Vehicle) {
    const supabase = createServiceRoleClient();

    try {
        if (vehicleData.photo && vehicleData.photo.startsWith('data:image')) {
            vehicleData.photo = await uploadImageFromDataUri(vehicleData.photo, 'vehicles', `vehicle-${vehicleData.id}`);
        }
    } catch (uploadError) {
        console.error("Vehicle image upload failed:", uploadError);
        return { data: null, error: { message: (uploadError as Error).message } };
    }

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
    revalidatePath('/');
    
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
    revalidatePath('/');

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
