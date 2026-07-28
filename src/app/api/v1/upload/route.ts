import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dmsu0kuji',
  api_key: process.env.CLOUDINARY_API_KEY || '727354766531332',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yKuCSVCKll3HVzl7fY9dign-J8s',
  secure: true,
});

// POST /api/v1/upload
// Receive image file upload and return Cloudinary CDN image URL
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'lalitpur_issues',
      resource_type: 'image',
    });

    return NextResponse.json({
      success: true,
      message: 'Image successfully uploaded to Cloudinary CDN.',
      imageUrl: uploadResult.secure_url,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      cloudinaryConfigured: true
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image to Cloudinary.' }, { status: 500 });
  }
}
