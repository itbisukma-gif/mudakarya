
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, status: 'pending' | 'disetujui' | 'tidak disetujui' | 'selesai' | 'dipesan') {
    const supabase = createServiceRoleClient();
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
    const supabase = createServiceRoleClient();
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
