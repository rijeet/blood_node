import { Collection, ObjectId, WithId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { BlogPost, BlogCategory, BlogTag } from '@/lib/models/blog';

const BLOG_COLLECTION = 'blog_posts';
const CATEGORY_COLLECTION = 'blog_categories';
const TAG_COLLECTION = 'blog_tags';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

async function getBlogPostsCollection(): Promise<Collection<BlogPost>> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  return client.db(DB_NAME).collection<BlogPost>(BLOG_COLLECTION);
}

async function getBlogCategoriesCollection(): Promise<Collection<BlogCategory>> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  return client.db(DB_NAME).collection<BlogCategory>(CATEGORY_COLLECTION);
}

async function getBlogTagsCollection(): Promise<Collection<BlogTag>> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  return client.db(DB_NAME).collection<BlogTag>(TAG_COLLECTION);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

// Blog Posts CRUD
export async function createBlogPost(post: Omit<BlogPost, 'created_at' | 'updated_at' | 'slug'>): Promise<WithId<BlogPost>> {
  const collection = await getBlogPostsCollection();
  const slug = generateSlug(post.title);
  const result = await collection.insertOne({
    ...post,
    slug,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return { _id: result.insertedId, ...post, slug, created_at: new Date(), updated_at: new Date() };
}

export async function getBlogPostById(id: ObjectId): Promise<WithId<BlogPost> | null> {
  const collection = await getBlogPostsCollection();
  return await collection.findOne({ _id: id });
}

export async function getBlogPostBySlug(slug: string): Promise<WithId<BlogPost> | null> {
  const collection = await getBlogPostsCollection();
  return await collection.findOne({ slug });
}

export async function getBlogPosts(filters: {
  category?: string;
  tag?: string;
  status?: 'draft' | 'published' | 'archived';
  author_id?: string;
  search?: string;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<WithId<BlogPost>[]> {
  const collection = await getBlogPostsCollection();
  const query: any = {};

  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.tag) {
    query.tags = filters.tag;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.author_id) {
    query.author_id = new ObjectId(filters.author_id);
  }
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { content: { $regex: filters.search, $options: 'i' } },
      { excerpt: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const sortField = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  const sort: { [key: string]: 1 | -1 } = { [sortField]: sortOrder };

  const limit = filters.limit || 10;
  const skip = filters.skip || 0;

  return await collection
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
}

export async function updateBlogPost(id: ObjectId, updates: Partial<BlogPost>): Promise<boolean> {
  const collection = await getBlogPostsCollection();
  const result = await collection.updateOne(
    { _id: id },
    { 
      $set: {
        ...updates,
        updated_at: new Date()
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function deleteBlogPost(id: ObjectId): Promise<boolean> {
  const collection = await getBlogPostsCollection();
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

// Blog Categories CRUD
export async function createBlogCategory(category: Omit<BlogCategory, 'created_at' | 'updated_at' | 'slug'>): Promise<WithId<BlogCategory>> {
  const collection = await getBlogCategoriesCollection();
  const slug = generateSlug(category.name);
  const result = await collection.insertOne({
    ...category,
    slug,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return { _id: result.insertedId, ...category, slug, created_at: new Date(), updated_at: new Date() };
}

export async function getBlogCategories(): Promise<WithId<BlogCategory>[]> {
  const collection = await getBlogCategoriesCollection();
  return await collection.find({}).sort({ name: 1 }).toArray();
}

// Blog Tags CRUD
export async function createBlogTag(tag: Omit<BlogTag, 'created_at' | 'updated_at' | 'slug'>): Promise<WithId<BlogTag>> {
  const collection = await getBlogTagsCollection();
  const slug = generateSlug(tag.name);
  const result = await collection.insertOne({
    ...tag,
    slug,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return { _id: result.insertedId, ...tag, slug, created_at: new Date(), updated_at: new Date() };
}

export async function getBlogTags(): Promise<WithId<BlogTag>[]> {
  const collection = await getBlogTagsCollection();
  return await collection.find({}).sort({ name: 1 }).toArray();
}

export async function getOrCreateBlogTag(tagName: string): Promise<WithId<BlogTag>> {
  const collection = await getBlogTagsCollection();
  const slug = generateSlug(tagName);
  
  let tag = await collection.findOne({ slug });
  
  if (!tag) {
    const newTag = await createBlogTag({
      name: tagName
    });
    tag = newTag;
  }
  
  return tag;
}