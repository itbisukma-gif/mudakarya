'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const vehicleData = await request.json();

    const { data, error } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { onConflict: 'id' })
        .select()
        .single();
    
    if (error) {
        console.error('Error upserting vehicle:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { vehicleId } = await request.json();
    
    const { data: itemData, error: fetchError } = await supabase.from('vehicles').select('photo').eq('id', vehicleId).single();
    if (fetchError) {
        console.error("Error fetching vehicle for deletion:", fetchError);
        return NextResponse.json({ error: fetchError }, { status: 500 });
    }
    
    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
    
    if (error) {
        console.error('Error deleting vehicle:', error);
        return NextResponse.json({ error }, { status: 500 });
    }

    if(itemData.photo) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.photo.substring(itemData.photo.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }

    return NextResponse.json({ error: null });
}

export async function PATCH(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { vehicleId, status } = await request.json();

    const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId);
    
    if (error) {
        console.error('Error updating vehicle status:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json({ error: null });
}
