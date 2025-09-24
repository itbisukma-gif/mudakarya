
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';

function getSupabase() {
    try {
        return createServiceRoleClient();
    } catch (e) {
        return null;
    }
}

/**
 * Creates a signed upload URL for the client to upload a file directly to Supabase Storage.
 * This runs on the server and uses the service_role key for security.
 * @param filePath The full path in the bucket where the file will be uploaded.
 * @returns An object containing the signed URL, the token, and the path.
 */
export async function createSignedUploadUrl(filePath: string) {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: { message: "Server is not ready for uploads." }, signedUrl: null, token: null };
    }

    try {
        const { data, error } = await supabase.storage
            .from('mudakarya-bucket')
            .createSignedUploadUrl(filePath);

        if (error) {
            console.error('Error creating signed upload URL:', error);
            return { error, signedUrl: null, token: null };
        }

        return { signedUrl: data.signedUrl, token: data.token, error: null };
    } catch (e) {
        const error = e as Error;
        console.error('Unexpected error in createSignedUploadUrl:', error);
        return { error: { message: error.message }, signedUrl: null, token: null };
    }
}
