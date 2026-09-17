import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Filter, ChevronDown, Camera } from 'lucide-react';

interface Review {
  id: string;
  reviewer_name: string;
  title: string | null;
  body: string;
  rating: number;
  images: string[];
  created_at: string;
  is_verified_buyer: boolean;
}

interface ApprovedReviewsProps {
  productSlug: string;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export const ApprovedReviews: React.FC<ApprovedReviewsProps> = ({ productSlug }) => {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterWithImages, setFilterWithImages] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('id, reviewer_name, title, body, rating, images, created_at, is_verified_buyer')
          .eq('product_slug', productSlug)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAllReviews(data || []);
        setFilteredReviews(data || []);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [productSlug]);

  // Apply Filters & Sort whenever dependencies change
  useEffect(() => {
    let result = [...allReviews];

    // 1. Filter by Rating
    if (filterRating !== 'all') {
      result = result.filter(r => Math.round(r.rating) === filterRating);
    }

    // 2. Filter by Images
    if (filterWithImages) {
      result = result.filter(r => r.images && r.images.length > 0);
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    setFilteredReviews(result);
  }, [allReviews, filterRating, sortBy, filterWithImages]);

  const renderStars = (rating: number, size = "w-5 h-5") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={size}
            fill={i <= rating ? '#fbbf24' : '#e5e7eb'} // Amber-400 vs Gray-200 (filled vs empty)
            stroke="none"
          />
        ))}
      </div>
    );
  };

  // Calculate stats
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: allReviews.filter(r => Math.round(r.rating) === star).length,
    percent: allReviews.length > 0
      ? (allReviews.filter(r => Math.round(r.rating) === star).length / allReviews.length) * 100
      : 0
  }));

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  if (allReviews.length === 0) {
    return (
      <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Star className="w-8 h-8 text-gray-300" fill="none" />
        </div>
        <h3 className="text-gray-900 font-semibold text-lg mb-2">No reviews yet</h3>
        <p className="text-gray-500">Be the first to share your thoughts on this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header & Stats Section */}
      <div className="grid md:grid-cols-3 gap-8 items-center pb-10 border-b border-gray-100">
        {/* Main Score */}
        <div className="text-center md:text-left md:col-span-1">
          <div className="text-6xl font-bold text-gray-900 mb-2">{avgRating}</div>
          <div className="flex justify-center md:justify-start mb-2">
            {renderStars(Math.round(parseFloat(avgRating)), "w-6 h-6")}
          </div>
          <p className="text-gray-500 font-medium">
            Based on {allReviews.length} review{allReviews.length !== 1 && 's'}
          </p>
        </div>

        {/* Progress Bars */}
        <div className="md:col-span-2 space-y-2">
          {ratingCounts.map(({ star, count, percent }) => (
            <button
              key={star}
              onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
              className="flex items-center gap-4 w-full group"
            >
              <div className="flex items-center gap-1 w-12 flex-shrink-0">
                <span className={`font-medium ${filterRating === star ? 'text-pink-500' : 'text-gray-600'}`}>{star}</span>
                <Star className="w-3 h-3 text-gray-400" fill="currentColor" stroke="none" />
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${filterRating === star ? 'bg-pink-500' : 'bg-yellow-400 group-hover:bg-yellow-500'}`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <div className="w-8 text-right text-sm text-gray-400 tabular-nums group-hover:text-gray-600">
                {count}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setFilterRating('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterRating === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilterWithImages(!filterWithImages)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
              filterWithImages
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            With Photos
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No reviews match your filters.
          </div>
        ) : (
          filteredReviews.map(review => (
            <div
              key={review.id}
              className="bg-white pb-8 border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 font-bold text-lg">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{review.reviewer_name}</span>
                      {review.is_verified_buyer && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-green-100">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {renderStars(review.rating, "w-3.5 h-3.5")}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {review.title && (
                <h4 className="font-bold text-gray-900 mb-2">{review.title}</h4>
              )}

              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-4">{review.body}</p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review photo ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-100"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
