import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadToSupabase(
	file: File | string, 
	folder: string = 'properties'
): Promise<{ url: string; path: string }> {
	try {
		let fileToUpload: File;
		let fileName: string;

		if (typeof file === 'string') {
			// Convert base64 to File
			const response = await fetch(file);
			const blob = await response.blob();
			fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
			fileToUpload = new File([blob], fileName, { type: 'image/jpeg' });
		} else {
			fileToUpload = file;
			fileName = `${Date.now()}-${file.name}`;
		}

		const filePath = `${folder}/${fileName}`;

		const { data, error } = await supabase.storage
			.from('images')
			.upload(filePath, fileToUpload);

		if (error) {
			throw new Error(`Upload failed: ${error.message}`);
		}

		// Get public URL
		const { data: { publicUrl } } = supabase.storage
			.from('images')
			.getPublicUrl(filePath);

		return {
			url: publicUrl,
			path: filePath
		};
	} catch (error) {
		console.error('Supabase upload error:', error);
		throw error;
	}
}

export async function deleteFromSupabase(filePath: string): Promise<void> {
	try {
		const { error } = await supabase.storage
			.from('images')
			.remove([filePath]);

		if (error) {
			throw new Error(`Delete failed: ${error.message}`);
		}
	} catch (error) {
		console.error('Supabase delete error:', error);
		throw error;
	}
}
