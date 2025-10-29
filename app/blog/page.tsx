import Link from 'next/link';
import { getBlogPosts } from '@/lib/db/blog';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

async function fetchPosts() {
  try {
    const posts = await getBlogPosts({
      status: 'published',
      limit: 12,
      sortBy: 'published_at',
      sortOrder: 'desc'
    });
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export default async function BlogListPage() {
  const posts = await fetchPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Our Blog</h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Stay updated with blood donation news, health tips, and community stories
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600">Check back soon for updates and news!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => {
              const publishedDate = post.published_at 
                ? new Date(post.published_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                : '';

              return (
                <Link 
                  key={post._id} 
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:-translate-y-2">
                    {/* Image */}
                    {post.featured_image ? (
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-red-100 to-red-200">
                        <img 
                          src={post.featured_image} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-red-100 via-pink-100 to-red-200 flex items-center justify-center">
                        <Tag className="h-16 w-16 text-red-300" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Category Badge */}
                      {post.category && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                            {post.category}
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      {publishedDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4" />
                          <time>{publishedDate}</time>
                          <span className="mx-2">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{post.reading_time || 2} min read</span>
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-gray-600 mb-4 flex-grow line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Read More */}
                      <div className="flex items-center text-red-600 font-semibold group-hover:gap-2 transition-all">
                        <span>Read more</span>
                        <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


