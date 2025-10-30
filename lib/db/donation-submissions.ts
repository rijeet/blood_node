import clientPromise from '@/lib/mongodb';
import { DonationSubmission, DonationSubmissionCreateInput } from '@/lib/models/donation-submission';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'donations_submissions';

export async function createDonationSubmission(data: DonationSubmissionCreateInput): Promise<DonationSubmission> {
  const client = await clientPromise;
  if (!client) throw new Error('Database connection failed');
  const db = client.db(DB_NAME);
  const col = db.collection<DonationSubmission>(COLLECTION_NAME);
  const doc: DonationSubmission = {
    ...data,
    created_at: new Date(),
  } as DonationSubmission;
  const res = await col.insertOne(doc);
  doc._id = res.insertedId;
  return doc;
}

export async function listDonationSubmissions({ limit = 100, method, q }: { limit?: number; method?: string; q?: string; }) {
  const client = await clientPromise;
  if (!client) throw new Error('Database connection failed');
  const db = client.db(DB_NAME);
  const col = db.collection<DonationSubmission>(COLLECTION_NAME);
  const filter: any = {};
  if (method) filter.method = method;
  if (q) {
    filter.$or = [
      { trx_id: { $regex: q, $options: 'i' } },
      { agent: { $regex: q, $options: 'i' } },
      { contact: { $regex: q, $options: 'i' } },
      { notes: { $regex: q, $options: 'i' } },
    ];
  }
  const items = await col
    .find(filter)
    .sort({ created_at: -1 })
    .limit(Math.min(limit, 1000))
    .toArray();
  return items.map(i => ({ ...i, _id: i._id }));
}


