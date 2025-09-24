'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const promoData = await request.json();
    
    const { data, error } = await supabase.from('promotions').upsert(promoData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting promotion:', error);
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { promoId } = await request.json();

    const { data: itemData, error: fetchError } = await supabase.from('promotions').select('imageUrl').eq('id', promoId).single();
    if (fetchError) {
        console.error("Error fetching promotion for deletion:", fetchError);
        return NextResponse.json({ error: fetchError }, { status: 500 });
    }

    const { error } = await supabase.from('promotions').delete().eq('id', promoId);
    if (error) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json({ error }, { status: 500 });
    }

    if(itemData.imageUrl) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.imageUrl.substring(itemData.imageUrl.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }
    
    return NextResponse.json({ error: null });
}
