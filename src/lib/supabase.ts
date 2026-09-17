import { createClient } from '@supabase/supabase-js';

// Support new env names while preserving legacy ones
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta as any).env.SUPABASE_URL || (import.meta as any).env.SUPABASE_DATABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !String(supabaseUrl).includes('placeholder.supabase.co') &&
  !String(supabaseAnonKey).includes('placeholder-key')
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables (VITE_SUPABASE_URL/SUPABASE_URL/SUPABASE_DATABASE_URL, VITE_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY)');
  // Use placeholder values to prevent the app from crashing
  // In production, these should be set in Netlify
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-yvmnedjybrpvlupygusf-auth-token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'blom-cosmetics'
      }
    }
  }
);

// Types for our database schema
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  barcode: string | null;
  inventory_quantity: number;
  track_inventory: boolean;
  is_active: boolean;
  is_featured: boolean;
  featured_home_image: string | null;
  weight: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  barcode: string | null;
  inventory_quantity: number;
  weight: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  author_id: string | null;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  duration_hours: number;
  max_students: number | null;
  instructor_name: string;
  instructor_bio: string;
  featured_image: string | null;
  course_type: 'online' | 'in-person' | 'hybrid';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  is_featured: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Helper functions for common queries
export const queries = {
  // Get featured products for homepage
  getFeaturedProducts: async () => {
    // const { data, error } = await supabase
    //   .from('products')
    //   .select(`
    //     *,
    //     product_images (
    //       id,
    //       image_url,
    //       alt_text,
    //       sort_order
    //     )
    //   `)
    //   .eq('is_featured', true)
    //   .eq('is_active', true)
    //   .order('created_at', { ascending: false });

    // if (error) throw error;
    // return data;
    return [];
  },

  // Get all active categories
  getCategories: async () => {
    // const { data, error } = await supabase
    //   .from('categories')
    //   .select('*')
    //   .eq('is_active', true)
    //   .order('sort_order', { ascending: true });

    // if (error) throw error;
    // return data;
    return [];
  },

  // Get published blog posts
  getBlogPosts: async (limit = 10) => {
    // const { data, error } = await supabase
    //   .from('blog_posts')
    //   .select('*')
    //   .eq('status', 'published')
    //   .order('published_at', { ascending: false })
    //   .limit(limit);

    // if (error) throw error;
    // return data;
    return [];
  },

  // Get active courses
  getCourses: async () => {
    // const { data, error } = await supabase
    //   .from('courses')
    //   .select('*')
    //   .eq('is_active', true)
    //   .order('created_at', { ascending: false });

    // if (error) throw error;
    // return data;
    return [];
  },

  // Get featured courses
  getFeaturedCourses: async () => {
    // const { data, error } = await supabase
    //   .from('courses')
    //   .select('*')
    //   .eq('is_featured', true)
    //   .eq('is_active', true)
    //   .order('created_at', { ascending: false });

    // if (error) throw error;
    // return data;
    return [];
  },

  // Get products by category
  getProductsByCategory: async (categorySlug: string) => {
    // const { data, error } = await supabase
    //   .from('products')
    //   .select(`
    //     *,
    //     product_images (
    //       id,
    //       image_url,
    //       alt_text,
    //       sort_order
    //     ),
    //     product_categories!inner (
    //       category:categories (
    //         slug
    //       )
    //     )
    //   `)
    //   .eq('is_active', true)
    //   .eq('product_categories.categories.slug', categorySlug)
    //   .order('created_at', { ascending: false });

    // if (error) throw error;
    // return data;
    return [];
  },

  // Get single product by slug
  getProductBySlug: async (slug: string) => {
    // const { data, error } = await supabase
    //   .from('products')
    //   .select(`
    //     *,
    //     product_images (
    //       id,
    //       image_url,
    //       alt_text,
    //       sort_order
    //     ),
    //     product_variants (
    //       id,
    //       title,
    //       price,
    //       compare_at_price,
    //       sku,
    //       inventory_quantity,
    //       option1,
    //       option2,
    //       option3,
    //       is_active
    //     )
    //   `)
    //   .eq('slug', slug)
    //   .eq('is_active', true)
    //   .maybeSingle();

    // if (error) throw error;
    // return data;
    return null;
  }
};
