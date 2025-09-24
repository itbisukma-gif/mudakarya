'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });

    const featureData = await request.json();
    const { data, error } = await supabase.from('features').upsert(featureData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting feature:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });

    const { id } = await request.json();
    const { data: itemData, error: fetchError } = await supabase.from('features').select('imageUrl').eq('id', id).single();
    if (fetchError) {
        console.error("Error fetching feature for deletion:", fetchError);
        return NextResponse.json({ error: fetchError }, { status: 500 });
    }

    const { error } = await supabase.from('features').delete().eq('id', id);
    if (error) return NextResponse.json({ error }, { status: 500 });

    if(itemData.imageUrl) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.imageUrl.substring(itemData.imageUrl.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }
    
    return NextResponse.json({ error: null });
}
