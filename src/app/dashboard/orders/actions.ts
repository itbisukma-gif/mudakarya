
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
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

export async function updateOrderStatus(orderId: string, status: 'pending' | 'disetujui' | 'tidak disetujui' | 'selesai' | 'dipesan') {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };

    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating order status:', error);
        return { data: null, error };
    }

    revalidatePath('/dashboard/orders');
    return { data, error: null };
}

export async function updateOrderDriver(orderId: string, driverName: string, driverId: string) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };

    const { data, error } = await supabase
        .from('orders')
        .update({ driver: driverName, driverId: driverId })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Error updating order driver:', error);
        return { data: null, error };
    }
    
    revalidatePath('/dashboard/orders');
    return { data, error: null };
}
