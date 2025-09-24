
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';

/**
 * Creates a signed upload URL for the client to upload a file directly to Supabase Storage.
 * This runs on the server and uses the service_role key for security.
 * @param filePath The full path in the bucket where the file will be uploaded.
 * @returns An object containing the signed URL, the token, and the path.
 */
export async function createSignedUploadUrl(filePath: string) {
    try {
        const supabase = createServiceRoleClient();
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
        // Check if the error is due to Supabase client not being available during build.
        if (error.message.includes("Supabase URL and Service Role Key are required")) {
            return { error: { message: "Server is not ready for uploads." }, signedUrl: null, token: null };
        }
        return { error: { message: error.message }, signedUrl: null, token: null };
    }
}
