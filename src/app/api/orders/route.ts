'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { orderId, status, driverName, driverId } = await request.json();

    let query = supabase.from('orders').update({ status }).eq('id', orderId);
    if(driverName && driverId){
        query = supabase.from('orders').update({ driver: driverName, driverId: driverId }).eq('id', orderId);
    } else if (status) {
        query = supabase.from('orders').update({ status }).eq('id', orderId);
    } else {
        return NextResponse.json({ error: { message: 'Invalid parameters' } }, { status: 400 });
    }

    const { data, error } = await query.select().single();
    
    if (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
}
