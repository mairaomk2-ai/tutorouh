import {
  users,
  studentProfiles,
  teacherProfiles,
  kycDocuments,
  requirements,
  messages,
  reviews,
  userRequests,
  supportMessages,
  type User,
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type TeacherProfile,
  type InsertTeacherProfile,
  type KycDocument,
  type InsertKycDocument,
  type Requirement,
  type InsertRequirement,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
  type SupportMessage,
  type InsertSupportMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, like, inArray, ne, sql, isNotNull, gte, lt } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  cleanupExpiredMessages(): Promise<void>;
  
  // Student profile operations
  getStudentProfile(userId: string): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(userId: string, updates: Partial<StudentProfile>): Promise<StudentProfile>;
  
  // Teacher profile operations
  getTeacherProfile(userId: string): Promise<TeacherProfile | undefined>;
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  updateTeacherProfile(userId: string, updates: Partial<TeacherProfile>): Promise<TeacherProfile>;
  
  // KYC operations
  getKycDocument(teacherId: string): Promise<KycDocument | undefined>;
  createKycDocument(document: InsertKycDocument): Promise<KycDocument>;
  updateKycStatus(teacherId: string, status: "pending" | "approved" | "rejected"): Promise<void>;
  
  // Requirement operations
  getRequirements(filters?: {
    userType?: "student" | "teacher";
    subjects?: string[];
    location?: string;
  }): Promise<Requirement[]>;
  getUserRequirement(userId: string): Promise<Requirement | undefined>;
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  deleteRequirement(userId: string): Promise<void>;
  
  // Message operations
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(fromUserId: string, toUserId: string): Promise<void>;
  getConversations(userId: string): Promise<any[]>;
  toggleMessageLike(messageId: string): Promise<Message>;
  
  // Review operations
  getReviews(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Search methods
  searchTeachers(filters: any): Promise<any[]>;
  searchStudents(filters: any): Promise<any[]>;
  
  // Location methods
  updateUserLocation(userId: string, locationData: any): Promise<User>;
  updateUserLiveLocation(userId: string, locationData: any): Promise<User>;
  getNearbyLiveUsers(userId: string, targetUserType: string, currentLat: number, currentLng: number, radius: number): Promise<any[]>;

  // Request methods  
  createUserRequest(request: any): Promise<any>;
  getSentRequests(userId: string): Promise<any[]>;
  getReceivedRequests(userId: string): Promise<any[]>;
  updateRequestStatus(requestId: string, status: string, userId: string): Promise<any>;

  // Search operations
  searchTeachers(filters: {
    subjects?: string[];
    location?: string;
    verified?: boolean;
  }): Promise<any[]>;
  searchStudents(filters: {
    classes?: string[];
    location?: string;
  }): Promise<any[]>;

  
  // Support methods
  createSupportMessage(message: any): Promise<any>;
  getAllSupportMessages(): Promise<any[]>;
  updateSupportMessage(id: string, updates: any): Promise<any>;
  getUserSupportMessages(userId: string): Promise<SupportMessage[]>;
  replySupportMessage(id: string, adminReply: string): Promise<SupportMessage>;
  
  // Admin methods
  getAdminStats(): Promise<any>;
  getAllUsersWithProfiles(filters?: { userType?: "student" | "teacher"; page?: number; limit?: number }): Promise<any[]>;
  getAllTeachersDetailed(): Promise<any[]>;
  getAllConversations(): Promise<any[]>;
  banUser(userId: string, reason: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  getNearbyUsers(userId: string, targetUserType: string, currentLat: number, currentLng: number, radius: number): Promise<any[]>;
  
  // User deletion methods
  deleteUserCompletely(userId: string): Promise<{ success: boolean; message: string }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline,
        lastSeen: isOnline ? undefined : new Date()
      })
      .where(eq(users.id, id));
  }

  async cleanupExpiredMessages(): Promise<void> {
    // Only cleanup messages older than 30 days to preserve admin conversations
    await db
      .delete(messages)
      .where(sql`expires_at < NOW() AND created_at < NOW() - INTERVAL '30 days'`);
  }

  async toggleMessageLike(messageId: string): Promise<Message> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
      
    const [updatedMessage] = await db
      .update(messages)
      .set({ isLiked: !message.isLiked })
      .where(eq(messages.id, messageId))
      .returning();
      
    return updatedMessage;
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId));
    return profile;
  }

  async createStudentProfile(profileData: InsertStudentProfile): Promise<StudentProfile> {
    const [profile] = await db
      .insert(studentProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateStudentProfile(
    userId: string,
    updates: Partial<StudentProfile>
  ): Promise<StudentProfile> {
    const [profile] = await db
      .update(studentProfiles)
      .set(updates)
      .where(eq(studentProfiles.userId, userId))
      .returning();
    return profile;
  }

  async getTeacherProfile(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db
      .select()
      .from(teacherProfiles)
      .where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  async createTeacherProfile(profileData: InsertTeacherProfile): Promise<TeacherProfile> {
    const [profile] = await db
      .insert(teacherProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateTeacherProfile(
    userId: string,
    updates: Partial<TeacherProfile>
  ): Promise<TeacherProfile> {
    const [profile] = await db
      .update(teacherProfiles)
      .set(updates)
      .where(eq(teacherProfiles.userId, userId))
      .returning();
    return profile;
  }

  async getKycDocument(teacherId: string): Promise<KycDocument | undefined> {
    const [document] = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.teacherId, teacherId));
    return document;
  }

  async createKycDocument(documentData: InsertKycDocument): Promise<KycDocument> {
    const [document] = await db
      .insert(kycDocuments)
      .values(documentData)
      .returning();
    return document;
  }

  async updateKycStatus(
    teacherId: string,
    status: "pending" | "approved" | "rejected"
  ): Promise<void> {
    await db
      .update(kycDocuments)
      .set({ status, reviewedAt: new Date() })
      .where(eq(kycDocuments.teacherId, teacherId));

    if (status === "approved") {
      await db
        .update(teacherProfiles)
        .set({ isVerified: true, kycStatus: "approved" })
        .where(eq(teacherProfiles.id, teacherId));
    }
  }

  async getRequirements(filters?: {
    userType?: "student" | "teacher";
    subjects?: string[];
    location?: string;
  }): Promise<any[]> {
    const conditions = [eq(requirements.isActive, true)];

    if (filters?.userType) {
      conditions.push(eq(requirements.userType, filters.userType));
    }

    if (filters?.location) {
      conditions.push(like(requirements.location, `%${filters.location}%`));
    }

    return await db
      .select({
        id: requirements.id,
        userId: requirements.userId,
        userType: requirements.userType,
        subjects: requirements.subjects,
        classes: requirements.classes,
        location: requirements.location,
        city: requirements.city,
        state: requirements.state,
        pinCode: requirements.pinCode,
        street: requirements.street,
        village: requirements.village,
        type: requirements.type,
        fee: requirements.fee,
        feeType: requirements.feeType,
        description: requirements.description,
        createdAt: requirements.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          email: users.email,
          isLocationVerified: users.isLocationVerified,
          latitude: users.latitude,
          longitude: users.longitude,
          fullAddress: users.fullAddress,
        },
      })
      .from(requirements)
      .leftJoin(users, eq(requirements.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(requirements.createdAt));
  }

  async getUserRequirement(userId: string): Promise<Requirement | undefined> {
    const [requirement] = await db
      .select()
      .from(requirements)
      .where(and(eq(requirements.userId, userId), eq(requirements.isActive, true)));
    return requirement;
  }

  async createRequirement(requirementData: InsertRequirement): Promise<Requirement> {
    // First delete any existing active requirement for the user
    await db
      .update(requirements)
      .set({ isActive: false })
      .where(eq(requirements.userId, requirementData.userId));

    const [requirement] = await db
      .insert(requirements)
      .values(requirementData)
      .returning();
    return requirement;
  }

  async deleteRequirement(userId: string): Promise<void> {
    await db
      .update(requirements)
      .set({ isActive: false })
      .where(eq(requirements.userId, userId));
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, userId1), eq(messages.toUserId, userId2)),
          and(eq(messages.fromUserId, userId2), eq(messages.toUserId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessagesAsRead(fromUserId: string, toUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(eq(messages.fromUserId, fromUserId), eq(messages.toUserId, toUserId))
      );
  }

  async getConversations(userId: string): Promise<any[]> {
    try {
      // Get all messages involving this user
      const allMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.fromUserId, userId),
            eq(messages.toUserId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      // Get all users involved in conversations
      const userIds = new Set<string>();
      allMessages.forEach(msg => {
        userIds.add(msg.fromUserId);
        userIds.add(msg.toUserId);
      });
      userIds.delete(userId); // Remove current user

      const conversationUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, Array.from(userIds)));

      // Create user lookup map
      const userMap = new Map();
      conversationUsers.forEach(user => {
        userMap.set(user.id, user);
      });

      // Group by conversation partner and get latest message
      const conversations = new Map();
      
      for (const msg of allMessages) {
        const otherUserId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
        const otherUser = userMap.get(otherUserId);
        
        if (otherUser && !conversations.has(otherUserId)) {
          conversations.set(otherUserId, {
            userId: otherUserId,
            name: `${otherUser.firstName} ${otherUser.lastName || ''}`.trim(),
            profileImage: otherUser.profileImage,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: 0,
            isVerified: otherUser.isLocationVerified,
            isOnline: otherUser.isOnline
          });
        }
      }
      
      // Count unread messages for each conversation
      for (const msg of allMessages) {
        if (msg.toUserId === userId && !msg.isRead) {
          const conv = conversations.get(msg.fromUserId);
          if (conv) {
            conv.unreadCount += 1;
          }
        }
      }
      
      return Array.from(conversations.values()).sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    } catch (error) {
      console.error('getConversations error:', error);
      return [];
    }
  }

  async getReviews(userId: string): Promise<Review[]> {
    const reviewsWithUserInfo = await db
      .select({
        id: reviews.id,
        fromUserId: reviews.fromUserId,
        toUserId: reviews.toUserId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.toUserId, userId))
      .orderBy(desc(reviews.createdAt));
    
    return reviewsWithUserInfo;
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async searchTeachers(filters: {
    subjects?: string[];
    location?: string;
    verified?: boolean;
  }): Promise<any[]> {
    const conditions = [eq(users.userType, "teacher")];

    // Only filter by verification if specifically requested
    if (filters.verified === true) {
      conditions.push(eq(users.isLocationVerified, true));
    }

    if (filters.location) {
      conditions.push(like(users.city, `%${filters.location}%`));
    }

    const teachers = await db
      .select({
        id: users.id,
        name: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        subjects: teacherProfiles.subjects,
        qualification: teacherProfiles.qualification,
        experience: teacherProfiles.experience,
        bio: teacherProfiles.bio,
        city: users.city,
        state: users.state,
        pinCode: users.pinCode,
        fullAddress: users.fullAddress,
        latitude: users.latitude,
        longitude: users.longitude,
        rating: teacherProfiles.rating,
        studentCount: teacherProfiles.studentCount,
        isVerified: users.isLocationVerified,
        isLocationVerified: users.isLocationVerified,
        isOnline: users.isOnline,
        userType: users.userType,
        monthlyFee: teacherProfiles.monthlyFee,
      })
      .from(users)
      .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(users.isLocationVerified));

    // Filter by subjects if specified
    if (filters.subjects && filters.subjects.length > 0) {
      return teachers.filter(teacher => 
        teacher.subjects && teacher.subjects.length > 0 &&
        filters.subjects!.some(subject => 
          teacher.subjects!.some((ts: string) => 
            ts.toLowerCase().includes(subject.toLowerCase())
          )
        )
      );
    }

    return teachers;
  }

  async searchStudents(filters: {
    studentClass?: string;
    classes?: string[];
    location?: string;
    verified?: boolean;
  }): Promise<any[]> {
    const conditions = [eq(users.userType, "student")];

    // Only filter by verification if specifically requested
    if (filters.verified === true) {
      conditions.push(eq(users.isLocationVerified, true));
    }

    if (filters.location) {
      conditions.push(like(users.city, `%${filters.location}%`));
    }

    const students = await db
      .select({
        id: users.id,
        name: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        class: studentProfiles.class,
        schoolName: studentProfiles.schoolName,
        budgetMin: studentProfiles.budgetMin,
        budgetMax: studentProfiles.budgetMax,
        preferredSubjects: studentProfiles.preferredSubjects,
        city: users.city,
        state: users.state,
        pinCode: users.pinCode,
        fullAddress: users.fullAddress,
        latitude: users.latitude,
        longitude: users.longitude,
        isVerified: users.isLocationVerified,
        isLocationVerified: users.isLocationVerified,
        isOnline: users.isOnline,
        userType: users.userType,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(users.isLocationVerified));

    // Filter by single class if specified (for API route)
    if (filters.studentClass && filters.studentClass !== 'all') {
      return students.filter(student => 
        student.class && student.class.toLowerCase().includes(filters.studentClass!.toLowerCase())
      );
    }

    // Filter by classes if specified (legacy support)
    if (filters.classes && filters.classes.length > 0) {
      return students.filter(student => 
        student.class && 
        filters.classes!.some(cls => 
          student.class!.toLowerCase().includes(cls.toLowerCase())
        )
      );
    }

    return students;
  }

  // Location methods implementation
  async updateUserLocation(userId: string, locationData: any): Promise<User> {
    // Update user's location and set location verification to true
    const [user] = await db
      .update(users)
      .set({
        latitude: locationData.latitude.toString(),
        longitude: locationData.longitude.toString(),
        fullAddress: locationData.fullAddress,
        street: locationData.street,
        city: locationData.city,
        state: locationData.state,
        pinCode: locationData.pinCode,
        isLocationVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // If user is a teacher, also update their verification status
    const userWithProfile = await this.getUser(userId);
    if (userWithProfile?.userType === 'teacher') {
      await db
        .update(teacherProfiles)
        .set({
          isVerified: true,
          city: locationData.city,
          state: locationData.state,
          pinCode: locationData.pinCode,
          street: locationData.street
        })
        .where(eq(teacherProfiles.userId, userId));
    } else if (userWithProfile?.userType === 'student') {
      await db
        .update(studentProfiles)
        .set({
          city: locationData.city,
          state: locationData.state,
          pinCode: locationData.pinCode,
          street: locationData.street
        })
        .where(eq(studentProfiles.userId, userId));
    }

    return user;
  }

  async updateUserLiveLocation(userId: string, locationData: any): Promise<User> {
    const updateData: any = {};
    
    if (locationData.latitude !== undefined) {
      updateData.latitude = locationData.latitude.toString();
    }
    if (locationData.longitude !== undefined) {
      updateData.longitude = locationData.longitude.toString();
    }
    if (locationData.fullAddress !== undefined) {
      updateData.fullAddress = locationData.fullAddress;
    }
    if (locationData.isLiveSharing !== undefined) {
      updateData.isLiveSharing = locationData.isLiveSharing;
    }
    if (locationData.liveLocationUpdatedAt !== undefined) {
      updateData.liveLocationUpdatedAt = new Date(locationData.liveLocationUpdatedAt);
    }
    
    updateData.updatedAt = new Date();

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return user;
  }





  async getNearbyUsers(userId: string, targetUserType: string, currentLat: number, currentLng: number, radius: number): Promise<any[]> {
    // Use provided location coordinates
    const radiusKm = radius;

    // Query for nearby users who have location verified (not requiring live sharing)
    const nearbyUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        profileImage: users.profileImage,
        latitude: users.latitude,
        longitude: users.longitude,
        fullAddress: users.fullAddress,
        city: users.city,
        state: users.state,
        pinCode: users.pinCode,
        isLocationVerified: users.isLocationVerified,
        monthlyFee: teacherProfiles.monthlyFee,
      })
      .from(users)
      .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
      .where(
        and(
          ne(users.id, userId), // Exclude current user
          eq(users.isLocationVerified, true), // Only users with verified location
          eq(users.userType, targetUserType as any),
          isNotNull(users.latitude), // Ensure latitude is not null
          isNotNull(users.longitude) // Ensure longitude is not null
        )
      );

    // Filter by distance using Haversine formula
    const nearbyUsersWithDistance = nearbyUsers
      .map(user => {
        if (!user.latitude || !user.longitude) return null;
        
        const userLat = parseFloat(user.latitude);
        const userLng = parseFloat(user.longitude);
        
        // Haversine formula to calculate distance
        const R = 6371; // Earth's radius in km
        const dLat = (userLat - currentLat) * Math.PI / 180;
        const dLng = (userLng - currentLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(currentLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
          ...user,
          distance: distance,
          currentLocation: {
            city: user.city || 'Unknown',
            state: user.state || 'Unknown',
            pinCode: user.pinCode || 'Unknown', 
            fullAddress: user.fullAddress || `${user.latitude}, ${user.longitude}`
          }
        };
      })
      .filter(user => user && user.distance <= radiusKm)
      .sort((a, b) => a!.distance - b!.distance);

    return nearbyUsersWithDistance;
  }

  async getNearbyLiveUsers(userId: string, targetUserType: string, currentLat: number, currentLng: number, radius: number): Promise<any[]> {
    // Use provided location coordinates
    const radiusKm = radius;

    // Query for nearby users who are live sharing
    const nearbyUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        profileImage: users.profileImage,
        latitude: users.latitude,
        longitude: users.longitude,
        fullAddress: users.fullAddress,
        city: users.city,
        state: users.state,
        liveLocationUpdatedAt: users.liveLocationUpdatedAt,
        isLocationVerified: users.isLocationVerified,
      })
      .from(users)
      .where(
        and(
          ne(users.id, userId), // Exclude current user
          eq(users.isLiveSharing, true), // Only users who are live sharing
          eq(users.userType, targetUserType as any)
        )
      );

    // Filter by distance using Haversine formula
    const nearbyUsersWithDistance = nearbyUsers
      .map(user => {
        if (!user.latitude || !user.longitude) return null;
        
        const userLat = parseFloat(user.latitude);
        const userLng = parseFloat(user.longitude);
        
        // Haversine formula to calculate distance
        const R = 6371; // Earth's radius in km
        const dLat = (userLat - currentLat) * Math.PI / 180;
        const dLng = (userLng - currentLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(currentLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
          ...user,
          distance: distance,
          currentLocation: {
            city: user.city || 'Unknown',
            state: user.state || 'Unknown', 
            fullAddress: user.fullAddress || `${user.latitude}, ${user.longitude}`
          },
          lastLocationUpdate: user.liveLocationUpdatedAt
        };
      })
      .filter(user => user && user.distance <= radiusKm)
      .sort((a, b) => a!.distance - b!.distance);

    return nearbyUsersWithDistance;
  }

  // Request methods implementation
  async createUserRequest(request: any): Promise<any> {
    const [newRequest] = await db.insert(userRequests).values(request).returning();
    return newRequest;
  }

  async getSentRequests(userId: string): Promise<any[]> {
    const requests = await db
      .select()
      .from(userRequests)
      .innerJoin(users, eq(userRequests.receiverId, users.id))
      .where(eq(userRequests.senderId, userId))
      .orderBy(desc(userRequests.createdAt));

    // Transform to expected format for frontend
    return requests.map((row: any) => ({
      id: row.user_requests.id,
      senderId: row.user_requests.senderId,
      receiverId: row.user_requests.receiverId,
      status: row.user_requests.status,
      message: row.user_requests.message,
      createdAt: row.user_requests.createdAt,
      toUser: {
        id: row.users.id,
        name: `${row.users.firstName} ${row.users.lastName || ''}`.trim(),
        profileImage: row.users.profileImage,
        userType: row.users.userType,
        subjects: row.users.subjects ? row.users.subjects.split(', ') : [],
        city: row.users.city,
        rating: row.users.rating,
        isVerified: row.users.isLocationVerified,
        qualification: '', // Will be filled from profile data
        class: '',
      }
    }));
  }

  async getReceivedRequests(userId: string): Promise<any[]> {
    const requests = await db
      .select()
      .from(userRequests)
      .innerJoin(users, eq(userRequests.senderId, users.id))
      .where(eq(userRequests.receiverId, userId))
      .orderBy(desc(userRequests.createdAt));

    // Transform to expected format for frontend
    return requests.map((row: any) => ({
      id: row.user_requests.id,
      senderId: row.user_requests.senderId,
      receiverId: row.user_requests.receiverId,
      status: row.user_requests.status,
      message: row.user_requests.message,
      createdAt: row.user_requests.createdAt,
      fromUser: {
        id: row.users.id,
        name: `${row.users.firstName} ${row.users.lastName || ''}`.trim(),
        profileImage: row.users.profileImage,
        userType: row.users.userType,
        subjects: row.users.subjects ? row.users.subjects.split(', ') : [],
        city: row.users.city,
        rating: row.users.rating,
        isVerified: row.users.isLocationVerified,
        qualification: '', // Will be filled from profile data
        class: '',
      }
    }));
  }

  async updateRequestStatus(requestId: string, status: string, userId: string): Promise<any> {
    // First get the request to return sender info
    const [request] = await db
      .select()
      .from(userRequests)
      .where(eq(userRequests.id, requestId));
    
    if (!request) {
      throw new Error("Request not found");
    }

    // Update the request status
    await db
      .update(userRequests)
      .set({ status })
      .where(eq(userRequests.id, requestId));

    return request;
  }








  // Support message methods
  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [supportMessage] = await db.insert(supportMessages).values(message).returning();
    return supportMessage;
  }

  async getAllSupportMessages(): Promise<SupportMessage[]> {
    const result = await db
      .select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt));
    
    return result;
  }

  async updateSupportMessage(id: string, updates: Partial<SupportMessage>): Promise<SupportMessage> {
    const [supportMessage] = await db
      .update(supportMessages)
      .set(updates)
      .where(eq(supportMessages.id, id))
      .returning();
    
    return supportMessage;
  }

  async getUserSupportMessages(userId: string): Promise<SupportMessage[]> {
    const result = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, userId))
      .orderBy(desc(supportMessages.createdAt));
    
    return result;
  }

  async replySupportMessage(id: string, adminReply: string): Promise<SupportMessage> {
    const [supportMessage] = await db
      .update(supportMessages)
      .set({ 
        adminReply, 
        status: "replied", 
        repliedAt: new Date() 
      })
      .where(eq(supportMessages.id, id))
      .returning();
    
    return supportMessage;
  }

  async getAdminStats(): Promise<any> {
    // Get user counts by type
    const totalUsersResult = await db
      .select({ count: sql`count(*)` })
      .from(users);
    
    const studentsResult = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.userType, 'student'));
    
    const teachersResult = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.userType, 'teacher'));
    
    const adminsResult = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.userType, 'admin'));

    // Get message stats
    const totalMessagesResult = await db
      .select({ count: sql`count(*)` })
      .from(messages);
    
    const supportMessagesResult = await db
      .select({ count: sql`count(*)` })
      .from(supportMessages);

    // Get requirements stats
    const totalRequirementsResult = await db
      .select({ count: sql`count(*)` })
      .from(requirements);

    const students = parseInt(studentsResult[0]?.count as string) || 0;
    const teachers = parseInt(teachersResult[0]?.count as string) || 0;
    const admins = parseInt(adminsResult[0]?.count as string) || 0;
    
    return {
      totalUsers: students + teachers, // Exclude admins from regular user count
      students: students,
      teachers: teachers,
      admins: admins,
      totalMessages: parseInt(totalMessagesResult[0]?.count as string) || 0,
      supportMessages: parseInt(supportMessagesResult[0]?.count as string) || 0,
      totalRequirements: parseInt(totalRequirementsResult[0]?.count as string) || 0,
    };
  }

  async getAllUsersWithProfiles(filters?: { userType?: "student" | "teacher"; page?: number; limit?: number }): Promise<any[]> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    
    // Exclude admin users from regular user lists
    whereConditions.push(ne(users.userType, 'admin'));
    
    if (filters?.userType) {
      whereConditions.push(eq(users.userType, filters.userType as any));
    }
    
    const usersData = await db
      .select()
      .from(users)
      .where(and(...whereConditions))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get profile data for each user and reset online status to realistic values
    const usersWithProfiles = await Promise.all(
      usersData.map(async (user) => {
        let profile = null;
        if (user.userType === 'student') {
          profile = await this.getStudentProfile(user.id);
        } else if (user.userType === 'teacher') {
          profile = await this.getTeacherProfile(user.id);
        }
        
        // Check if user was online recently (within last 5 minutes)
        const lastSeenTime = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
        const currentTime = new Date().getTime();
        const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
        const recentlyOnline = lastSeenTime > fiveMinutesAgo;
        
        return {
          ...user,
          password: undefined,
          // Only show as online if they were seen recently and isOnline is true
          isOnline: user.isOnline && recentlyOnline,
          profile
        };
      })
    );
    
    return usersWithProfiles;
  }

  async getAllTeachersDetailed(): Promise<any[]> {
    const teachers = await db
      .select()
      .from(users)
      .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
      .where(eq(users.userType, 'teacher'))
      .orderBy(desc(users.createdAt));
    
    return teachers.map(row => ({
      id: row.users.id,
      firstName: row.users.firstName,
      lastName: row.users.lastName,
      email: row.users.email,
      mobile: row.users.mobile,
      profileImage: row.users.profileImage,
      isLocationVerified: row.users.isLocationVerified,
      city: row.users.city,
      state: row.users.state,
      fullAddress: row.users.fullAddress,
      isOnline: row.users.isOnline,
      lastSeen: row.users.lastSeen,
      createdAt: row.users.createdAt,
      // Teacher profile data
      subjects: row.teacher_profiles?.subjects || [],
      bio: row.teacher_profiles?.bio,
      qualification: row.teacher_profiles?.qualification,
      experience: row.teacher_profiles?.experience,
      monthlyFee: row.teacher_profiles?.monthlyFee,
      rating: row.teacher_profiles?.rating,
      studentCount: row.teacher_profiles?.studentCount,
      isVerified: row.teacher_profiles?.isVerified,
      kycStatus: row.teacher_profiles?.kycStatus
    }));
  }

  async getAllConversations(): Promise<any[]> {
    const conversations = await db
      .select({
        messageId: messages.id,
        fromUserId: messages.fromUserId,
        toUserId: messages.toUserId,
        content: messages.content,
        attachment: messages.attachment,
        attachmentType: messages.attachmentType,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        fromUserFirstName: sql`from_user.first_name`,
        fromUserLastName: sql`from_user.last_name`,
        fromUserProfileImage: sql`from_user.profile_image`,
        toUserFirstName: sql`to_user.first_name`,
        toUserLastName: sql`to_user.last_name`,
        toUserProfileImage: sql`to_user.profile_image`,
      })
      .from(messages)
      .leftJoin(sql`users as from_user`, eq(messages.fromUserId, sql`from_user.id`))
      .leftJoin(sql`users as to_user`, eq(messages.toUserId, sql`to_user.id`))
      .orderBy(desc(messages.createdAt));

    return conversations.map(row => ({
      id: row.messageId,
      content: row.content,
      attachment: row.attachment,
      attachmentType: row.attachmentType,
      isRead: row.isRead,
      createdAt: row.createdAt,
      fromUser: {
        id: row.fromUserId,
        name: `${row.fromUserFirstName} ${row.fromUserLastName || ''}`.trim(),
        profileImage: row.fromUserProfileImage
      },
      toUser: {
        id: row.toUserId,
        name: `${row.toUserFirstName} ${row.toUserLastName || ''}`.trim(),
        profileImage: row.toUserProfileImage
      }
    }));
  }

  async banUser(userId: string, reason: string): Promise<void> {
    // Get current user to modify email for ban tracking
    const user = await this.getUser(userId);
    if (user && !user.email.includes('_BANNED')) {
      await db
        .update(users)
        .set({ 
          isOnline: false,
          email: user.email + '_BANNED'
        })
        .where(eq(users.id, userId));
    }
  }

  async unbanUser(userId: string): Promise<void> {
    // Get current user to restore original email
    const user = await this.getUser(userId);
    if (user && user.email.includes('_BANNED')) {
      await db
        .update(users)
        .set({ 
          isOnline: true,
          email: user.email.replace('_BANNED', '')
        })
        .where(eq(users.id, userId));
    }
  }

  async getSupportConversations(): Promise<any[]> {
    // Get support conversations grouped by user with latest message
    const supportChats = await db
      .select({
        userId: supportMessages.userId,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        userEmail: users.email,
        userImage: users.profileImage,
        userType: users.userType,
        lastMessage: supportMessages.message,
        lastMessageTime: supportMessages.createdAt,
        status: supportMessages.status,
        hasReply: sql<boolean>`${supportMessages.adminReply} IS NOT NULL`,
        messageCount: sql<number>`COUNT(*) OVER (PARTITION BY ${supportMessages.userId})`
      })
      .from(supportMessages)
      .leftJoin(users, eq(supportMessages.userId, users.id))
      .orderBy(desc(supportMessages.createdAt));

    // Group by user to get latest conversation per user
    const groupedChats = supportChats.reduce((acc: any[], chat) => {
      const existing = acc.find(c => c.userId === chat.userId);
      if (!existing) {
        acc.push({
          userId: chat.userId,
          userName: chat.userName,
          userEmail: chat.userEmail,
          userImage: chat.userImage,
          userType: chat.userType,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          status: chat.status,
          hasReply: chat.hasReply,
          messageCount: chat.messageCount
        });
      }
      return acc;
    }, []);

    return groupedChats;
  }

  async getSupportMessages(userId: string): Promise<any[]> {
    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, userId))
      .orderBy(asc(supportMessages.createdAt));

    return messages;
  }

  async addSupportReply(userId: string, adminId: string, replyMessage: string): Promise<any> {
    // Update the latest support message with admin reply
    const latestMessage = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, userId))
      .orderBy(desc(supportMessages.createdAt))
      .limit(1);

    if (latestMessage.length > 0) {
      await db
        .update(supportMessages)
        .set({
          adminReply: replyMessage,
          status: 'replied',
          repliedAt: new Date()
        })
        .where(eq(supportMessages.id, latestMessage[0].id));

      return { success: true, messageId: latestMessage[0].id };
    }

    return { success: false };
  }

  async deleteUserCompletely(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get user info first to check if exists
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Prevent deletion of admin users
      if (user.userType === "admin") {
        return { success: false, message: "Cannot delete admin users" };
      }

      // Delete all related data in the correct order (foreign key constraints)
      console.log(`Starting deletion of user: ${user.firstName} ${user.lastName} (${user.email})`);

      // Delete messages (both sent and received)
      await db.delete(messages).where(
        or(
          eq(messages.fromUserId, userId),
          eq(messages.toUserId, userId)
        )
      );
      console.log('Deleted messages');

      // Delete user requests (both sent and received)
      await db.delete(userRequests).where(
        or(
          eq(userRequests.senderId, userId),
          eq(userRequests.receiverId, userId)
        )
      );
      console.log('Deleted user requests');

      // Delete support messages
      await db.delete(supportMessages).where(eq(supportMessages.userId, userId));
      console.log('Deleted support messages');

      // Delete reviews (both given and received)
      await db.delete(reviews).where(
        or(
          eq(reviews.fromUserId, userId),
          eq(reviews.toUserId, userId)
        )
      );
      console.log('Deleted reviews');

      // Delete requirements
      await db.delete(requirements).where(eq(requirements.userId, userId));
      console.log('Deleted requirements');

      // Delete KYC documents (for teachers) - first get teacher profile ID
      if (user.userType === "teacher") {
        const teacherProfile = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
        if (teacherProfile.length > 0) {
          await db.delete(kycDocuments).where(eq(kycDocuments.teacherId, teacherProfile[0].id));
          console.log('Deleted KYC documents');
        }
      }

      // Delete profile data based on user type
      if (user.userType === "student") {
        await db.delete(studentProfiles).where(eq(studentProfiles.userId, userId));
        console.log('Deleted student profile');
      } else if (user.userType === "teacher") {
        await db.delete(teacherProfiles).where(eq(teacherProfiles.userId, userId));
        console.log('Deleted teacher profile');
      }

      // Finally, delete the user
      await db.delete(users).where(eq(users.id, userId));
      console.log('Deleted user account');

      return { 
        success: true, 
        message: `Successfully deleted ${user.userType} account: ${user.firstName} ${user.lastName}` 
      };
    } catch (error) {
      console.error('Error during user deletion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        message: `Failed to delete user: ${errorMessage}` 
      };
    }
  }

}

export const storage = new DatabaseStorage();
