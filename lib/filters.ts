/**
 * Filter utilities for URL query string serialization/deserialization
 * Used for saved searches functionality
 */

export type FilterObject = Record<string, string | number | boolean | null | undefined>;

/**
 * Converts a filter object to a URL query string
 * @param filters - Object containing filter key-value pairs
 * @returns URL query string (e.g., "investor=Sequoia&industry=Fintech")
 * @example
 * serializeFilters({ investor: "Sequoia", industry: "Fintech" })
 * // Returns: "investor=Sequoia&industry=Fintech"
 */
export function serializeFilters(filters: FilterObject): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    // Skip null, undefined, and empty string values
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

