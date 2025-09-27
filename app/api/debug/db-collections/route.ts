// Debug endpoint to check database collections and their contents
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const db = client.db(process.env.MONGODB_DATABASE || 'blood_node');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const coll = db.collection(collection.name);
        const count = await coll.countDocuments();
        const indexes = await coll.indexes();
        
        // Get a sample document for each collection
        let sampleDoc = null;
        if (count > 0) {
          sampleDoc = await coll.findOne({}, { limit: 1 });
        }
        
        return {
          name: collection.name,
          count,
          indexes: indexes.length,
          sample: sampleDoc
        };
      })
    );

    return NextResponse.json({
      success: true,
      database: process.env.MONGODB_DATABASE || 'blood_node',
      collections: collectionStats
    });

  } catch (error) {
    console.error('Database collections check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database collections' },
      { status: 500 }
    );
  }
}
