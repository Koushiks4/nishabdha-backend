import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from './logger';

class SupabaseAdmin {
  private static instance: SupabaseClient | null = null;

  static getInstance(): SupabaseClient {
    if (!this.instance) {
      this.instance = createClient(
        config.supabase.url,
        config.supabase.serviceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      logger.info('Supabase admin client initialized');
    }

    return this.instance;
  }
}

export const supabaseAdmin = SupabaseAdmin.getInstance();
