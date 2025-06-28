import { createClient } from '@supabase/supabase-js';

// Enhanced Supabase client with automatic error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ve Anon Key .env dosyasında eksik. Lütfen .env dosyasını kontrol edin.');
  
  // Show user-friendly error
  const showConfigError = () => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    errorDiv.innerHTML = `
      <div class="bg-white rounded-xl p-8 max-w-md w-full">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-neutral-800 mb-2">Konfigürasyon Hatası</h2>
          <p class="text-neutral-600 mb-4">Supabase bağlantı bilgileri eksik. Lütfen .env dosyasını kontrol edin.</p>
          <div class="bg-neutral-50 p-4 rounded-lg text-left">
            <p class="text-sm font-mono">VITE_SUPABASE_URL=your_supabase_url</p>
            <p class="text-sm font-mono">VITE_SUPABASE_ANON_KEY=your_anon_key</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  };

  // Show error after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showConfigError);
  } else {
    showConfigError();
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Enhanced query wrapper with automatic error logging
export const supabaseQuery = {
  from: (table: string) => {
    const originalFrom = supabase.from(table);
    
    return {
      select: async (columns?: string) => {
        try {
          const result = await originalFrom.select(columns);
          if (result.error) {
            logSupabaseError('select', table, result.error);
          }
          return result;
        } catch (error) {
          logSupabaseError('select', table, error as Error);
          throw error;
        }
      },
      
      insert: async (data: any) => {
        try {
          const result = await originalFrom.insert(data);
          if (result.error) {
            logSupabaseError('insert', table, result.error);
          }
          return result;
        } catch (error) {
          logSupabaseError('insert', table, error as Error);
          throw error;
        }
      },
      
      update: async (data: any) => {
        try {
          const result = await originalFrom.update(data);
          if (result.error) {
            logSupabaseError('update', table, result.error);
          }
          return result;
        } catch (error) {
          logSupabaseError('update', table, error as Error);
          throw error;
        }
      },
      
      delete: async () => {
        try {
          const result = await originalFrom.delete();
          if (result.error) {
            logSupabaseError('delete', table, result.error);
          }
          return result;
        } catch (error) {
          logSupabaseError('delete', table, error as Error);
          throw error;
        }
      },
      
      // Chain methods
      eq: (column: string, value: any) => originalFrom.eq(column, value),
      neq: (column: string, value: any) => originalFrom.neq(column, value),
      gt: (column: string, value: any) => originalFrom.gt(column, value),
      gte: (column: string, value: any) => originalFrom.gte(column, value),
      lt: (column: string, value: any) => originalFrom.lt(column, value),
      lte: (column: string, value: any) => originalFrom.lte(column, value),
      like: (column: string, pattern: string) => originalFrom.like(column, pattern),
      ilike: (column: string, pattern: string) => originalFrom.ilike(column, pattern),
      is: (column: string, value: any) => originalFrom.is(column, value),
      in: (column: string, values: any[]) => originalFrom.in(column, values),
      contains: (column: string, value: any) => originalFrom.contains(column, value),
      containedBy: (column: string, value: any) => originalFrom.containedBy(column, value),
      rangeGt: (column: string, range: string) => originalFrom.rangeGt(column, range),
      rangeGte: (column: string, range: string) => originalFrom.rangeGte(column, range),
      rangeLt: (column: string, range: string) => originalFrom.rangeLt(column, range),
      rangeLte: (column: string, range: string) => originalFrom.rangeLte(column, range),
      rangeAdjacent: (column: string, range: string) => originalFrom.rangeAdjacent(column, range),
      overlaps: (column: string, value: any) => originalFrom.overlaps(column, value),
      textSearch: (column: string, query: string) => originalFrom.textSearch(column, query),
      match: (query: Record<string, any>) => originalFrom.match(query),
      not: (column: string, operator: string, value: any) => originalFrom.not(column, operator, value),
      or: (filters: string) => originalFrom.or(filters),
      filter: (column: string, operator: string, value: any) => originalFrom.filter(column, operator, value),
      order: (column: string, options?: { ascending?: boolean }) => originalFrom.order(column, options),
      limit: (count: number) => originalFrom.limit(count),
      range: (from: number, to: number) => originalFrom.range(from, to),
      single: () => originalFrom.single(),
      maybeSingle: () => originalFrom.maybeSingle()
    };
  },
  
  rpc: async (fn: string, args?: Record<string, any>) => {
    try {
      const result = await supabase.rpc(fn, args);
      if (result.error) {
        logSupabaseError('rpc', fn, result.error);
      }
      return result;
    } catch (error) {
      logSupabaseError('rpc', fn, error as Error);
      throw error;
    }
  }
};

const logSupabaseError = (operation: string, table: string, error: any) => {
  const errorLog = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    operation: `${operation}_${table}`,
    status: 'error',
    details: {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      table
    }
  };

  // Log to console
  console.error(`Supabase ${operation} error on ${table}:`, error);

  // Store in localStorage
  const existingLogs = JSON.parse(localStorage.getItem('supabase_logs') || '[]');
  existingLogs.unshift(errorLog);
  localStorage.setItem('supabase_logs', JSON.stringify(existingLogs.slice(0, 100)));
};