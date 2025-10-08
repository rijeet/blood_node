import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '../mongodb';

export interface EmergencyResponse {
  _id?: ObjectId;
  emergency_alert_id: ObjectId;
  responder_user_id: ObjectId;
  responder_user_code: string;
  responder_name: string;
  responder_blood_type: string;
  responder_location: {
    address: string;
    geohash: string;
    coordinates: [number, number];
  };
  response_message?: string;
  status: 'pending' | 'selected' | 'rejected' | 'completed' | 'cancelled';
  can_donate_immediately: boolean;
  available_times?: string[];
  contact_preference: 'phone' | 'email' | 'both';
  created_at: Date;
  updated_at: Date;
  selected_at?: Date;
  completed_at?: Date;
  distance_km?: number;
}

export interface EmergencyResponseWithUser extends EmergencyResponse {
  responder_profile: {
    name: string;
    email: string;
    phone?: string;
    blood_type: string;
    location_address: string;
    last_donation_date?: Date;
    public_profile: boolean;
  };
}

// Get emergency responses collection
export async function getEmergencyResponsesCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  return client.db(process.env.MONGODB_DATABASE).collection<EmergencyResponse>('emergency_responses');
}

// Create emergency response
export async function createEmergencyResponse(responseData: Omit<EmergencyResponse, '_id' | 'created_at' | 'updated_at'>): Promise<EmergencyResponse> {
  const collection = await getEmergencyResponsesCollection();
  
  const response: EmergencyResponse = {
    ...responseData,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(response);
  return { ...response, _id: result.insertedId };
}

// Get responses for an emergency alert
export async function getEmergencyResponses(emergencyAlertId: ObjectId): Promise<EmergencyResponseWithUser[]> {
  const collection = await getEmergencyResponsesCollection();
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const usersCollection = client.db(process.env.MONGODB_DATABASE).collection('users');

  const responses = await collection
    .find({ emergency_alert_id: emergencyAlertId })
    .sort({ created_at: 1 })
    .toArray();

  // Get user profiles for each response
  const responsesWithUsers: EmergencyResponseWithUser[] = [];
  
  for (const response of responses) {
    const user = await usersCollection.findOne({ _id: response.responder_user_id });
    if (user) {
      responsesWithUsers.push({
        ...response,
        responder_profile: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          blood_type: user.blood_group_public,
          location_address: user.location_address,
          last_donation_date: user.last_donation_date,
          public_profile: user.public_profile
        }
      });
    }
  }

  return responsesWithUsers;
}

// Get response by ID
export async function getEmergencyResponseById(responseId: ObjectId): Promise<EmergencyResponse | null> {
  const collection = await getEmergencyResponsesCollection();
  return await collection.findOne({ _id: responseId });
}

// Update response status
export async function updateEmergencyResponseStatus(
  responseId: ObjectId, 
  status: EmergencyResponse['status'],
  additionalData?: Partial<EmergencyResponse>
): Promise<boolean> {
  const collection = await getEmergencyResponsesCollection();
  
  const updateData: any = {
    status,
    updated_at: new Date()
  };

  if (status === 'selected') {
    updateData.selected_at = new Date();
  } else if (status === 'completed') {
    updateData.completed_at = new Date();
  }

  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  const result = await collection.updateOne(
    { _id: responseId },
    { $set: updateData }
  );

  return result.modifiedCount > 0;
}

// Get user's responses to emergency alerts
export async function getUserEmergencyResponses(userId: ObjectId): Promise<EmergencyResponse[]> {
  const collection = await getEmergencyResponsesCollection();
  
  return await collection
    .find({ responder_user_id: userId })
    .sort({ created_at: -1 })
    .toArray();
}

// Check if user has already responded to an emergency
export async function hasUserRespondedToEmergency(emergencyAlertId: ObjectId, userId: ObjectId): Promise<boolean> {
  const collection = await getEmergencyResponsesCollection();
  
  const response = await collection.findOne({
    emergency_alert_id: emergencyAlertId,
    responder_user_id: userId
  });

  return response !== null;
}

// Get response statistics for an emergency
export async function getEmergencyResponseStats(emergencyAlertId: ObjectId): Promise<{
  total_responses: number;
  pending_responses: number;
  selected_responses: number;
  completed_responses: number;
  rejected_responses: number;
}> {
  const collection = await getEmergencyResponsesCollection();
  
  const pipeline = [
    { $match: { emergency_alert_id: emergencyAlertId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];

  const results = await collection.aggregate(pipeline).toArray();
  
  const stats = {
    total_responses: 0,
    pending_responses: 0,
    selected_responses: 0,
    completed_responses: 0,
    rejected_responses: 0
  };

  results.forEach(result => {
    stats.total_responses += result.count;
    switch (result._id) {
      case 'pending':
        stats.pending_responses = result.count;
        break;
      case 'selected':
        stats.selected_responses = result.count;
        break;
      case 'completed':
        stats.completed_responses = result.count;
        break;
      case 'rejected':
        stats.rejected_responses = result.count;
        break;
    }
  });

  return stats;
}

// Cancel all pending responses for an emergency (when emergency is fulfilled)
export async function cancelPendingResponses(emergencyAlertId: ObjectId): Promise<number> {
  const collection = await getEmergencyResponsesCollection();
  
  const result = await collection.updateMany(
    { 
      emergency_alert_id: emergencyAlertId,
      status: 'pending'
    },
    { 
      $set: { 
        status: 'cancelled',
        updated_at: new Date()
      }
    }
  );

  return result.modifiedCount;
}
