import clientPromise from '@/lib/mongodb';
import { checkDatabaseHealth } from '@/lib/db/init';

export async function dbConnectionStatus() {
  if (!process.env.MONGODB_URI) {
    return "No MONGODB_URI environment variable";
  }
  if (!clientPromise) {
    return "Database client not initialized";
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.command({ ping: 1 });
    console.log("MongoDB connection successful:", result);
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}

/**
 * Get detailed database status including all collections
 */
export async function getDetailedConnectionStatus(): Promise<{
  connected: boolean;
  database: string;
  collections: Array<{
    name: string;
    exists: boolean;
    documentCount: number;
    indexCount: number;
  }>;
  errors: string[];
  timestamp: string;
}> {
  try {
    const health = await checkDatabaseHealth();
    
    return {
      connected: health.healthy,
      database: process.env.MONGODB_DATABASE || 'blood_node',
      collections: health.collections,
      errors: health.errors,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      connected: false,
      database: process.env.MONGODB_DATABASE || 'blood_node',
      collections: [],
      errors: [error.message],
      timestamp: new Date().toISOString()
    };
  }
}
