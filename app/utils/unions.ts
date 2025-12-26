import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Union {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a URL-friendly slug from a union name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if needed
 * @param baseName - The base name to generate slug from
 * @param client - Optional Supabase client (for server-side use with auth)
 */
export async function generateUniqueSlug(
  baseName: string,
  client?: SupabaseClient<any, 'public', any>
): Promise<string> {
  const supabaseClient = client || supabase;
  let slug = generateSlug(baseName);
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const { data, error } = await supabaseClient
      .from('unions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error checking slug uniqueness:', error);
      // If there's an error, append timestamp to make it unique
      return `${slug}-${Date.now()}`;
    }

    if (!data) {
      // Slug is unique
      isUnique = true;
    } else {
      // Slug exists, try with a number suffix
      slug = `${generateSlug(baseName)}-${counter}`;
      counter++;
    }
  }

  return slug;
}

/**
 * Get all unions created by the user
 */
export async function getUserUnions(userId: string): Promise<Union[]> {
  const { data, error } = await supabase
    .from('unions')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user unions:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a user is an admin of a union (they created it)
 */
export async function isUnionAdmin(
  userId: string,
  unionId: string
): Promise<boolean> {
  const { data: union } = await supabase
    .from('unions')
    .select('created_by')
    .eq('id', unionId)
    .single();

  return union?.created_by === userId;
}

/**
 * Get all unions where the user is an admin (they created them)
 */
export async function getAdminUnions(userId: string): Promise<Union[]> {
  const { data, error } = await supabase
    .from('unions')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin unions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get the first union slug for a user (for redirects)
 */
export async function getFirstUnionSlug(userId: string): Promise<string | null> {
  const unions = await getUserUnions(userId);
  return unions.length > 0 ? unions[0].slug : null;
}
