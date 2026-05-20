import type { PostgrestError } from '@supabase/supabase-js';

export class ServiceError extends Error {
  constructor(message: string, readonly code = 'UNKNOWN') {
    super(message);
    this.name = 'ServiceError';
  }
}

export const mapSupabaseError = (error: PostgrestError | Error | null, fallback: string): ServiceError => {
  if (!error) return new ServiceError(fallback);
  if ('code' in error && typeof error.code === 'string') {
    if (error.code === 'PGRST116') return new ServiceError('Resource not found', error.code);
    return new ServiceError(error.message || fallback, error.code);
  }
  return new ServiceError(error.message || fallback);
};
