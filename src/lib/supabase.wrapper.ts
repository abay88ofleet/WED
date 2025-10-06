import { createClient, SupabaseClient } from '@supabase/supabase-js';

function validateEnvironmentVariables() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables:', {
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseAnonKey ? 'present' : 'missing',
    });
    throw new Error('Missing required Supabase environment variables');
  }

  if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://localhost')) {
    throw new Error('Supabase URL must use HTTPS or be localhost');
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables();

// Create the client directly without extra validation that might interfere
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'document-management-system',
    },
  },
});

console.log('Supabase wrapper client initialized:', {
  url: supabaseUrl,
  clientType: typeof supabaseClient,
  hasFrom: typeof supabaseClient.from === 'function',
  hasAuth: typeof supabaseClient.auth === 'object',
  hasStorage: typeof supabaseClient.storage === 'object',
});

/**
 * Wrapper function that ensures queries work correctly
 */
export const safeSupabaseQuery = {
  from: (table: string) => {
    const tableRef = supabaseClient.from(table);
    
    return {
      select: (columns: string) => {
        const selectRef = tableRef.select(columns);
        
        // Return a wrapped object that ensures method chaining works
        return {
          eq: (column: string, value: any) => selectRef.eq(column, value),
          neq: (column: string, value: any) => selectRef.neq(column, value),
          gt: (column: string, value: any) => selectRef.gt(column, value),
          gte: (column: string, value: any) => selectRef.gte(column, value),
          lt: (column: string, value: any) => selectRef.lt(column, value),
          lte: (column: string, value: any) => selectRef.lte(column, value),
          like: (column: string, pattern: string) => selectRef.like(column, pattern),
          ilike: (column: string, pattern: string) => selectRef.ilike(column, pattern),
          is: (column: string, value: any) => selectRef.is(column, value),
          in: (column: string, values: any[]) => selectRef.in(column, values),
          contains: (column: string, value: any) => selectRef.contains(column, value),
          containedBy: (column: string, value: any) => selectRef.containedBy(column, value),
          rangeGt: (column: string, range: string) => selectRef.rangeGt(column, range),
          rangeGte: (column: string, range: string) => selectRef.rangeGte(column, range),
          rangeLt: (column: string, range: string) => selectRef.rangeLt(column, range),
          rangeLte: (column: string, range: string) => selectRef.rangeLte(column, range),
          rangeAdjacent: (column: string, range: string) => selectRef.rangeAdjacent(column, range),
          overlaps: (column: string, value: any) => selectRef.overlaps(column, value),
          textSearch: (column: string, query: string, config?: any) => selectRef.textSearch(column, query, config),
          match: (query: Record<string, any>) => selectRef.match(query),
          not: (column: string, operator: string, value: any) => selectRef.not(column, operator, value),
          filter: (column: string, operator: string, value: any) => selectRef.filter(column, operator, value),
          or: (filters: string) => selectRef.or(filters),
          order: (column: string, options?: any) => selectRef.order(column, options),
          limit: (count: number) => selectRef.limit(count),
          range: (from: number, to: number) => selectRef.range(from, to),
          abortSignal: (signal: AbortSignal) => selectRef.abortSignal(signal),
          single: () => selectRef.single(),
          maybeSingle: () => selectRef.maybeSingle(),
          csv: () => selectRef.csv(),
          explain: (options?: any) => selectRef.explain(options),
        };
      },
      insert: (values: any) => tableRef.insert(values),
      upsert: (values: any) => tableRef.upsert(values),
      update: (values: any) => tableRef.update(values),
      delete: () => tableRef.delete(),
    };
  },
};

export const supabase = supabaseClient;
export default supabaseClient;
