import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

export interface CloudinaryUploadResult {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	resource_type: string;
}

export async function uploadToCloudinary(
	base64Image: string, 
	folder: string = 'houserz/properties'
): Promise<CloudinaryUploadResult> {
	try {
		console.log('Starting Cloudinary upload...');
		
		// Use Cloudinary's uploader directly for more reliability
		const uploadResult = await cloudinary.uploader.upload(base64Image, {
			folder: folder,
			resource_type: 'auto',
			quality: 'auto:good',
			format: 'webp' // Optimize for web
		});

		console.log('Cloudinary upload successful:', uploadResult.public_id);
		
		return {
			public_id: uploadResult.public_id,
			secure_url: uploadResult.secure_url,
			width: uploadResult.width,
			height: uploadResult.height,
			format: uploadResult.format,
			resource_type: uploadResult.resource_type
		};
	} catch (error) {
		console.error('Cloudinary upload error:', error);
		throw error;
	}
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error('Cloudinary delete error:', error);
		throw new Error('Failed to delete image from Cloudinary');
	}
}

export function getOptimizedImageUrl(
	publicId: string, 
	width?: number, 
	height?: number,
	quality: string = 'auto:good'
): string {
	if (!width && !height) {
		return cloudinary.url(publicId, { secure: true, quality });
	}
	
	return cloudinary.url(publicId, {
		secure: true,
		transformation: [
			{ width, height, crop: 'fill', quality },
			{ format: 'webp' }
		]
	});
}

export default cloudinary;
