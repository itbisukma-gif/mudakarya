'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });

    const galleryData = await request.json();
    const { data, error } = await supabase.from('gallery').insert(galleryData).select().single();
    if (error) {
        console.error('Error adding gallery item:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    
    const { id } = await request.json();
    
    const { data: itemData, error: fetchError } = await supabase.from('gallery').select('url').eq('id', id).single();
    
    if (fetchError) {
        console.error("Error fetching gallery item for deletion:", fetchError);
        return NextResponse.json({ error: fetchError }, { status: 500 });
    }

    const { error: deleteDbError } = await supabase.from('gallery').delete().eq('id', id);
    if (deleteDbError) {
        console.error("Error deleting gallery item from DB:", deleteDbError);
        return NextResponse.json({ error: deleteDbError }, { status: 500 });
    }

    if (itemData.url) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.url.substring(itemData.url.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }

    return NextResponse.json({ error: null });
}
