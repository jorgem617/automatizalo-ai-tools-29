
/**
 * Safely cast data from Supabase to a specific type, handling potential errors
 * @param data The data returned from Supabase
 * @returns The data cast to the specified type or null if there's an error
 */
export function safeCast<T>(data: any): T {
  if (!data || data.error === true) {
    return null as unknown as T;
  }
  return data as T;
}

/**
 * Helper to safely cast an array of data from Supabase
 * @param dataArray Array of data from Supabase
 * @returns Array of safely cast items
 */
export function safeCastArray<T>(dataArray: any[]): T[] {
  if (!Array.isArray(dataArray)) {
    return [];
  }
  
  return dataArray.map(item => {
    return safeCast<T>(item);
  }).filter((item): item is T => item !== null);
}
