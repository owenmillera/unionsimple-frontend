import { supabase } from './supabase';

export interface Union {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
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
