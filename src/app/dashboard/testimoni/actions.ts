
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Testimonial, GalleryItem, FeatureItem } from '@/lib/types';
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

// --- Testimonial Actions ---

export async function upsertTestimonial(testimonialData: Omit<Testimonial, 'created_at'>) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Server Actions not available at build time." } };
    const { data, error } = await supabase.from('testimonials').upsert(testimonialData, { onConflict: 'id' }).select().single();
    
    if (error) {
        console.error('Error upserting testimonial:', error);
        return { data: null, error };
    }
    
    revalidatePath('/dashboard/testimoni');
    revalidatePath('/testimoni');
    revalidatePath('/mobil/[id]', 'page');
    return { data, error: null };
}


export async function deleteTestimonial(id: string) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Server Actions not available at build time." } };
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) {
        return { error };
    }
    revalidatePath('/dashboard/testimoni');
    revalidatePath('/testimoni');
     revalidatePath('/mobil/[id]', 'page');
    return { error: null };
}

// --- Gallery Actions ---

export async function addGalleryItem(galleryData: Omit<GalleryItem, 'id' | 'created_at'>) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Server Actions not available at build time." } };

    // The image URL should already be a public Supabase URL, no upload logic here.
    const { data, error } = await supabase.from('gallery').insert(galleryData).select().single();
    if (error) {
        console.error('Error adding gallery item:', error);
        return { data: null, error };
    }
    revalidatePath('/dashboard/testimoni');
    revalidatePath('/testimoni');
    revalidatePath('/mobil/[id]', 'page');
    return { data, error: null };
}

export async function deleteGalleryItem(id: string) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Server Actions not available at build time." } };
    // First, get the path of the object to delete from storage
    const { data: itemData, error: fetchError } = await supabase.from('gallery').select('url').eq('id', id).single();
    
    if (fetchError) {
        console.error("Error fetching gallery item for deletion:", fetchError);
        return { error: fetchError };
    }

    // Delete from DB
    const { error: deleteDbError } = await supabase.from('gallery').delete().eq('id', id);
    if (deleteDbError) {
        console.error("Error deleting gallery item from DB:", deleteDbError);
        return { error: deleteDbError };
    }

    // If DB deletion is successful, delete from storage
    if (itemData.url) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.url.substring(itemData.url.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }


    revalidatePath('/dashboard/testimoni');
    revalidatePath('/testimoni');
    revalidatePath('/mobil/[id]', 'page');
    return { error: null };
}


// --- Feature Actions ---

export async function upsertFeature(featureData: Omit<FeatureItem, 'created_at'>) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Server Actions not available at build time." } };

    // The image URL should already be a public Supabase URL, no upload logic here.
    const { data, error } = await supabase.from('features').upsert(featureData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting feature:', error);
        return { data: null, error };
    }
    revalidatePath('/dashboard/testimoni');
    revalidatePath('/');
    return { data, error: null };
}

export async function deleteFeature(id: string) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Server Actions not available at build time." } };

    const { data: itemData, error: fetchError } = await supabase.from('features').select('imageUrl').eq('id', id).single();
    if (fetchError) {
        console.error("Error fetching feature for deletion:", fetchError);
        return { error: fetchError };
    }

    const { error } = await supabase.from('features').delete().eq('id', id);
    if (error) return { error };

    if(itemData.imageUrl) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.imageUrl.substring(itemData.imageUrl.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }
    
    revalidatePath('/dashboard/testimoni');
    revalidatePath('/');
    return { error: null };
}
