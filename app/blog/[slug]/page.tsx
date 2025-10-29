import { getBlogPostBySlug } from '@/lib/db/blog';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';

interface Params {
  slug: string;
}

async function fetchPost(slug: string) {
  try {
    const post = await getBlogPostBySlug(slug);
    if (!post || post.status !== 'published') {
      return null;
    }
    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Post not found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const publishedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors font-medium group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Main Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Article Header */}
        <header className="mb-12">
          {/* Category Badge */}
          {post.category && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                <Tag className="h-3.5 w-3.5" />
                {post.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
            {publishedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at?.toString()}>{publishedDate}</time>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.reading_time || 2} min read</span>
            </div>
            {post.author_name && (
              <div className="text-gray-700 font-medium">
                By {post.author_name}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div 
          className="prose prose-lg md:prose-xl max-w-none
            prose-headings:text-gray-900 prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-10
            prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-gray-900 prose-h2:leading-tight
            prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-gray-900 prose-h3:leading-tight
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg prose-p:text-justify
            prose-a:text-red-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:text-red-700 hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-ul:space-y-4 prose-ul:mb-6 prose-ul:list-none
            prose-ul prose-li:relative prose-ul prose-li:pl-8
            prose-ul prose-li:before:content-[''] prose-ul prose-li:before:absolute prose-ul prose-li:before:left-0 prose-ul prose-li:before:top-4 prose-ul prose-li:before:w-2.5 prose-ul prose-li:before:h-2.5 prose-ul prose-li:before:bg-red-600 prose-ul prose-li:before:rounded-full
            prose-ol:space-y-4 prose-ol:mb-6 prose-ol:text-gray-700
            prose-ol prose-li:before:hidden
            prose-ol prose-li:pl-6 prose-ol prose-li:text-lg
            prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-8 prose-blockquote:bg-red-50 prose-blockquote:py-4 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg
            prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-12
            prose-code:bg-red-50 prose-code:text-red-700 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:font-semibold
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-6 prose-pre:overflow-x-auto prose-pre:shadow-2xl
            prose-hr:border-gray-300 prose-hr:my-12 prose-hr:border-t-2"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 mr-2">Tags:</span>
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 pt-8">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to All Posts
          </Link>
        </div>
      </article>
    </div>
  );
}


