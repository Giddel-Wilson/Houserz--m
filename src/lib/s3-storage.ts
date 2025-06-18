import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME } from '$env/static/private';

const s3Client = new S3Client({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

export async function uploadToS3(
	file: string | File,
	folder: string = 'properties'
): Promise<{ url: string; key: string }> {
	try {
		let buffer: Buffer;
		let contentType: string;
		let fileName: string;

		if (typeof file === 'string') {
			// Handle base64 string
			const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
			if (!matches) {
				throw new Error('Invalid base64 string');
			}
			contentType = matches[1];
			buffer = Buffer.from(matches[2], 'base64');
			fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
		} else {
			// Handle File object
			buffer = Buffer.from(await file.arrayBuffer());
			contentType = file.type;
			fileName = `${Date.now()}-${file.name}`;
		}

		const key = `${folder}/${fileName}`;

		const command = new PutObjectCommand({
			Bucket: AWS_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType,
			ACL: 'public-read',
		});

		await s3Client.send(command);

		const url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

		return { url, key };
	} catch (error) {
		console.error('S3 upload error:', error);
		throw error;
	}
}

export async function deleteFromS3(key: string): Promise<void> {
	try {
		const command = new DeleteObjectCommand({
			Bucket: AWS_BUCKET_NAME,
			Key: key,
		});

		await s3Client.send(command);
	} catch (error) {
		console.error('S3 delete error:', error);
		throw error;
	}
}
