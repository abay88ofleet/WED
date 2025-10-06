import { supabase } from '../lib/supabase';
import { Document } from '../types';

export interface SearchFilters {
  query?: string;
  categoryIds?: string[];
  tags?: string[];
  fileTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
  isFavorite?: boolean;
}

export interface SearchResult {
  document: Document;
  relevance: number;
  snippet?: string;
  highlightedTitle?: string;
}

export async function advancedSearch(filters: SearchFilters): Promise<{
  results: SearchResult[];
  totalCount: number;
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { results: [], totalCount: 0, error: 'User not authenticated' };
    }

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('uploaded_by', user.id);

    if (filters.query) {
      const searchTerm = filters.query.trim();
      const tsQuery = searchTerm.split(/\s+/).filter(w => w.length > 0).join(' & ');

      query = query.or(`
        title.ilike.%${searchTerm}%,
        description.ilike.%${searchTerm}%,
        file_name.ilike.%${searchTerm}%,
        ocr_text.ilike.%${searchTerm}%,
        tags.cs.{${searchTerm}}
      `);
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query = query.in('category_id', filters.categoryIds);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.fileTypes && filters.fileTypes.length > 0) {
      query = query.in('file_type', filters.fileTypes);
    }

    if (filters.dateFrom) {
      query = query.gte('uploaded_at', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      query = query.lte('uploaded_at', filters.dateTo.toISOString());
    }

    if (filters.minSize !== undefined) {
      query = query.gte('file_size', filters.minSize);
    }

    if (filters.maxSize !== undefined) {
      query = query.lte('file_size', filters.maxSize);
    }

    if (filters.isFavorite !== undefined) {
      query = query.eq('is_favorite', filters.isFavorite);
    }

    query = query.order('uploaded_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { results: [], totalCount: 0, error: error.message };
    }

    const { getDocumentUrl } = await import('./documentService.fixed');

    const results: SearchResult[] = await Promise.all((data || []).map(async (doc) => {
      const relevance = calculateRelevance(doc, filters.query || '');
      const snippet = generateSnippet(doc, filters.query || '');
      const highlightedTitle = highlightText(doc.title, filters.query || '');

      return {
        document: {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          fileName: doc.file_name,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          categoryId: doc.category_id,
          tags: doc.tags || [],
          uploadedBy: doc.uploaded_by,
          uploadedAt: new Date(doc.uploaded_at),
          updatedAt: new Date(doc.updated_at),
          fileUrl: await getDocumentUrl(doc.file_path),
          isFavorite: doc.is_favorite,
          downloadCount: doc.download_count,
          viewCount: doc.view_count,
        },
        relevance,
        snippet,
        highlightedTitle,
      };
    }));

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      results,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error performing advanced search:', error);
    return {
      results: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function calculateRelevance(doc: any, query: string): number {
  if (!query) return 1;

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  let score = 0;

  const titleLower = doc.title.toLowerCase();
  if (titleLower === queryLower) {
    score += 20;
  } else if (titleLower.includes(queryLower)) {
    score += 15;
  } else {
    const titleMatches = queryWords.filter(word => titleLower.includes(word)).length;
    score += titleMatches * 3;
  }

  const fileNameLower = doc.file_name.toLowerCase();
  if (fileNameLower === queryLower) {
    score += 10;
  } else if (fileNameLower.includes(queryLower)) {
    score += 7;
  } else {
    const fileNameMatches = queryWords.filter(word => fileNameLower.includes(word)).length;
    score += fileNameMatches * 2;
  }

  const descLower = doc.description.toLowerCase();
  if (descLower.includes(queryLower)) {
    score += 5;
  } else {
    const descMatches = queryWords.filter(word => descLower.includes(word)).length;
    score += descMatches * 1;
  }

  if (doc.tags && doc.tags.length > 0) {
    const tagMatches = doc.tags.filter((tag: string) => {
      const tagLower = tag.toLowerCase();
      return tagLower === queryLower || queryWords.some(word => tagLower.includes(word));
    }).length;
    score += tagMatches * 8;
  }

  if (doc.ocr_text && doc.ocr_text.toLowerCase().includes(queryLower)) {
    const ocrWords = doc.ocr_text.toLowerCase().split(/\s+/);
    const ocrMatches = queryWords.filter(word => ocrWords.some(w => w.includes(word))).length;
    score += Math.min(ocrMatches * 1.5, 10);
  }

  score += Math.min(doc.view_count * 0.15, 10);
  score += Math.min(doc.download_count * 0.25, 15);

  if (doc.is_favorite) {
    score += 8;
  }

  const daysSinceUpload = (Date.now() - new Date(doc.uploaded_at).getTime()) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 10 - daysSinceUpload * 0.2);
  score += recencyBoost;

  return score;
}

function generateSnippet(doc: any, query: string, maxLength = 150): string {
  if (!query) {
    return doc.description.substring(0, maxLength) + (doc.description.length > maxLength ? '...' : '');
  }

  const queryLower = query.toLowerCase();
  const textSources = [
    { text: doc.ocr_text || '', weight: 1 },
    { text: doc.description, weight: 3 },
  ];

  for (const source of textSources) {
    const text = source.text;
    const index = text.toLowerCase().indexOf(queryLower);

    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + query.length + 50);
      let snippet = text.substring(start, end);

      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';

      return highlightText(snippet, query);
    }
  }

  return doc.description.substring(0, maxLength) + (doc.description.length > maxLength ? '...' : '');
}

function highlightText(text: string, query: string): string {
  if (!query || !text) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getSuggestions(query: string, limit = 5): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('documents')
      .select('title, tags')
      .eq('uploaded_by', user.id)
      .or(`title.ilike.%${query}%, tags.cs.{${query}}`)
      .limit(limit);

    if (!data) return [];

    const suggestions = new Set<string>();

    data.forEach(doc => {
      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(doc.title);
      }
      doc.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

export async function getRecentSearches(limit = 10): Promise<string[]> {
  const searches = localStorage.getItem('recentSearches');
  if (!searches) return [];

  try {
    const parsed = JSON.parse(searches);
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function saveSearchToHistory(query: string) {
  const searches = getRecentSearches(100);
  const updated = [query, ...searches.filter(s => s !== query)].slice(0, 10);
  localStorage.setItem('recentSearches', JSON.stringify(updated));
}

export function clearSearchHistory() {
  localStorage.removeItem('recentSearches');
}
