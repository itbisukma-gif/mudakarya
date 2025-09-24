'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Driver } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function upsertDriver(driverData: Omit<Driver, 'created_at'>) {
    const supabase = createServiceRoleClient();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };
    const { data, error } = await supabase
        .from('drivers')
        .upsert(driverData, { onConflict: 'id' })
        .select()
        .single();
    
    if (error) {
        console.error('Error upserting driver:', error);
        return { data: null, error };
    }
    
    revalidatePath('/dashboard');
    return { data, error: null };
}


export async function deleteDriver(driverId: string) {
    const supabase = createServiceRoleClient();
    if (!supabase) return { error: { message: "Supabase client not available." } };
    
    const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);
    
    if (error) {
        console.error('Error deleting driver:', error);
        return { error };
    }

    revalidatePath('/dashboard');
    return { error: null };
}

export async function updateDriverStatus(driverId: string, status: 'Tersedia' | 'Bertugas') {
    const supabase = createServiceRoleClient();
    if (!supabase) return { error: { message: "Supabase client not available." } };

    const { error } = await supabase
        .from('drivers')
        .update({ status })
        .eq('id', driverId);

    if (error) {
        console.error('Error updating driver status:', error);
        return { error };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/orders');
    return { error: null };
}
