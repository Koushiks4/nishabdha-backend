import axios from 'axios';
import { supabaseAdmin } from '../utils/supabase';
import { logger } from '../utils/logger';

/**
 * Service for managing Supabase Storage operations.
 *
 * IMPORTANT: Call `ensureBucketExists()` before first use to ensure the storage bucket is available.
 */
export class SupabaseStorageService {
  private bucketName = 'product-images';

  constructor() {
    // Validate environment for backwards compatibility
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseServiceKey) {
      throw new Error('Missing Supabase credentials: SUPABASE_SERVICE_KEY');
    }
  }

  async ensureBucketExists(): Promise<void> {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some((b) => b.name === this.bucketName);

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(this.bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      logger.info(`Created bucket: ${this.bucketName}`);
    } else {
      logger.info(`Bucket already exists: ${this.bucketName}`);
    }
  }

  async downloadImage(url: string): Promise<Buffer> {
    // Validate URL to prevent SSRF attacks
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }

    // Only allow HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      throw new Error(`Only HTTPS URLs are allowed, got: ${parsedUrl.protocol}`);
    }

    // Restrict to allowed domains only
    const allowedDomains = ['picsum.photos', 'images.unsplash.com'];
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      throw new Error(`Only ${allowedDomains.join(', ')} domains are allowed, got: ${parsedUrl.hostname}`);
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 5 * 1024 * 1024, // 5MB max file size
      maxRedirects: 5,
      beforeRedirect: (_options, responseDetails) => {
        // Validate redirect URL
        const redirectUrl = new URL(responseDetails.headers.location || '', url);
        if (redirectUrl.protocol !== 'https:') {
          throw new Error('Redirect must use HTTPS protocol');
        }
        // Allow picsum.photos and fastly.picsum.photos (their CDN), and images.unsplash.com
        const allowedHosts = ['picsum.photos', 'fastly.picsum.photos', 'images.unsplash.com'];
        if (!allowedHosts.includes(redirectUrl.hostname)) {
          throw new Error(`Redirect to unauthorized domain: ${redirectUrl.hostname}`);
        }
      },
    });
    return Buffer.from(response.data);
  }

  async uploadImage(
    buffer: Buffer,
    path: string,
    contentType = 'image/jpeg'
  ): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucketName)
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image to ${path}: ${error.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async downloadAndUploadImage(
    sourceUrl: string,
    destinationPath: string
  ): Promise<string> {
    const imageBuffer = await this.downloadImage(sourceUrl);
    const publicUrl = await this.uploadImage(imageBuffer, destinationPath);
    return publicUrl;
  }
}
