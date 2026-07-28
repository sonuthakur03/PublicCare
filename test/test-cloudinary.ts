import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dmsu0kuji',
  api_key: process.env.CLOUDINARY_API_KEY || '727354766531332',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yKuCSVCKll3HVzl7fY9dign-J8s',
  secure: true
});

export async function runCloudinaryTest(): Promise<boolean> {
  console.log('\n--- 🧪 TEST 2: Cloudinary Image Upload & CDN URL Verification ---');
  try {
    // Small 1x1 transparent GIF base64 string for testing
    const sampleBase64Image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    console.log('📤 Uploading test image payload to Cloudinary...');
    const result = await cloudinary.uploader.upload(sampleBase64Image, {
      folder: 'lalitpur_issues_test'
    });

    console.log('✅ Cloudinary Upload Response:', {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format
    });

    if (!result.secure_url || !result.secure_url.startsWith('https://res.cloudinary.com/')) {
      throw new Error(`Invalid Cloudinary URL returned: ${result.secure_url}`);
    }

    // Clean up test image on Cloudinary
    await cloudinary.uploader.destroy(result.public_id);
    console.log('🧹 Cleaned up test image on Cloudinary.');

    console.log('🎉 PASS: Cloudinary Image Upload test passed!\n');
    return true;
  } catch (err: any) {
    console.error('❌ FAIL: Cloudinary test failed:', err);
    return false;
  }
}

if (require.main === module) {
  runCloudinaryTest().then((pass) => process.exit(pass ? 0 : 1));
}
