import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertUserSchema,
  insertStudentProfileSchema,
  insertTeacherProfileSchema,
  insertKycDocumentSchema,
  insertRequirementSchema,
  insertMessageSchema,
  insertReviewSchema,
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: "student" | "teacher" | "admin";
  };
}

interface CustomSocket extends Socket {
  userId?: string;
}

// Authentication middleware
const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Schedule cleanup of expired messages every 5 minutes
  setInterval(async () => {
    try {
      await storage.cleanupExpiredMessages();
      console.log('Cleaned up expired messages');
    } catch (error) {
      console.error('Error cleaning up expired messages:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Socket.io server for real-time messaging
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  const connectedUsers = new Map<string, string>(); // userId -> socketId
  const typingUsers = new Map<string, Set<string>>(); // userId -> Set of typing userIds

  io.on("connection", (socket: CustomSocket) => {
    console.log("User connected:", socket.id);
    
    socket.on("user_online", async (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // Update user online status
      await storage.updateUserOnlineStatus(userId, true);
      
      // Broadcast online status
      socket.broadcast.emit("user_status_change", { userId, isOnline: true });
    });

    socket.on("send_message", async (data) => {
      try {
        // Save message to database
        const savedMessage = await storage.createMessage({
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          content: data.content,
          attachment: data.attachment,
          attachmentType: data.attachmentType,
        });

        // Send to recipient if online
        const recipientSocketId = connectedUsers.get(data.toUserId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message_received", savedMessage);
        }
        
        // Confirm to sender
        socket.emit("message_sent", savedMessage);
      } catch (error) {
        console.error("Message send error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        socket.emit("message_error", { error: errorMessage });
      }
    });

    socket.on("typing_start", (data) => {
      const recipientSocketId = connectedUsers.get(data.toUserId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user_typing", { userId: data.fromUserId });
      }
    });

    socket.on("typing_stop", (data) => {
      const recipientSocketId = connectedUsers.get(data.toUserId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user_stopped_typing", { userId: data.fromUserId });
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
      
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Update user offline status
        await storage.updateUserOnlineStatus(socket.userId, false);
        
        // Broadcast offline status
        socket.broadcast.emit("user_status_change", { 
          userId: socket.userId, 
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      }
    });
  });

  // Profile endpoints
  app.get("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profileData = {
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
      };

      if (user.userType === "student") {
        const studentProfile = await storage.getStudentProfile(user.id);
        if (studentProfile) {
          Object.assign(profileData, {
            class: studentProfile.class,
            schoolName: studentProfile.schoolName,
            budgetMin: studentProfile.budgetMin || "2000",
            budgetMax: studentProfile.budgetMax || "10000",
            preferredSubjects: studentProfile.preferredSubjects || [],
          });
        }
      } else if (user.userType === "teacher") {
        const teacherProfile = await storage.getTeacherProfile(user.id);
        if (teacherProfile) {
          Object.assign(profileData, {
            subjects: teacherProfile.subjects,
            qualification: teacherProfile.qualification,
            experience: teacherProfile.experience,
            bio: teacherProfile.bio,
            monthlyFee: teacherProfile.monthlyFee || "5000",
          });
        }
      }

      res.json(profileData);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName, mobile, ...profileData } = req.body;
      
      // Update user basic info
      await storage.updateUser(req.user!.id, {
        firstName,
        lastName,
        mobile,
      });

      // Update profile-specific data
      if (req.user!.userType === "student") {
        const { class: studentClass, schoolName, budgetMin, budgetMax, preferredSubjects } = profileData;
        await storage.updateStudentProfile(req.user!.id, {
          class: studentClass,
          schoolName,
          budgetMin,
          budgetMax,
          preferredSubjects,
        });
      } else if (req.user!.userType === "teacher") {
        const { subjects, qualification, experience, bio, monthlyFee } = profileData;
        await storage.updateTeacherProfile(req.user!.id, {
          subjects,
          qualification,
          experience,
          bio,
          monthlyFee,
        });
      }

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { userType, ...userData } = req.body;
      
      // Validate user data
      const validatedUser = insertUserSchema.parse({
        ...userData,
        userType,
        password: await bcrypt.hash(userData.password, 10),
      });

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedUser.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Set default profile image based on user type
      const defaultProfileImage = userType === "teacher" 
        ? "/attached_assets/IMG_20250731_105128_697_1754293953715.jpg" 
        : "/attached_assets/images (2)_1754294016411.jpeg";
      
      validatedUser.profileImage = defaultProfileImage;

      // Create user
      const user = await storage.createUser(validatedUser);

      // Create profile based on user type
      if (userType === "student") {
        const profileData = insertStudentProfileSchema.parse({
          userId: user.id,
          class: userData.class,
          schoolName: userData.schoolName,
        });
        await storage.createStudentProfile(profileData);
      } else if (userType === "teacher") {
        const profileData = insertTeacherProfileSchema.parse({
          userId: user.id,
          subjects: userData.subjects || [],
          bio: userData.bio,
          qualification: userData.qualification,
          experience: userData.experience,
        });
        await storage.createTeacherProfile(profileData);
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({ token, user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profile = null;
      if (user.userType === "student") {
        profile = await storage.getStudentProfile(user.id);
      } else if (user.userType === "teacher") {
        profile = await storage.getTeacherProfile(user.id);
      }

      res.json({ user: { ...user, password: undefined }, profile });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Upload profile photo
  app.post("/api/auth/upload-profile", authenticateToken, upload.single('profileImage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user with new profile image path
      const updatedUser = await storage.updateUser(req.user!.id, {
        profileImage: `/uploads/${req.file.filename}`
      });

      res.json({ 
        message: "Profile photo updated successfully",
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Profile routes
  app.get("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profile = null;
      if (user.userType === "student") {
        profile = await storage.getStudentProfile(user.id);
      } else if (user.userType === "teacher") {
        profile = await storage.getTeacherProfile(user.id);
      }

      res.json({ ...user, password: undefined, ...profile });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.post("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user basic info
      const userUpdates: any = {};
      if (req.body.firstName) userUpdates.firstName = req.body.firstName;
      if (req.body.lastName) userUpdates.lastName = req.body.lastName;
      if (req.body.mobile) userUpdates.mobile = req.body.mobile;

      if (Object.keys(userUpdates).length > 0) {
        await storage.updateUser(userId, userUpdates);
      }

      // Update profile specific data
      if (user.userType === "student") {
        const profileUpdates: any = {};
        if (req.body.class) profileUpdates.class = req.body.class;
        if (req.body.schoolName) profileUpdates.schoolName = req.body.schoolName;
        
        if (Object.keys(profileUpdates).length > 0) {
          await storage.updateStudentProfile(userId, profileUpdates);
        }
      } else if (user.userType === "teacher") {
        const profileUpdates: any = {};
        if (req.body.subjects) profileUpdates.subjects = req.body.subjects;
        if (req.body.qualification) profileUpdates.qualification = req.body.qualification;
        if (req.body.experience) profileUpdates.experience = parseInt(req.body.experience);
        if (req.body.bio) profileUpdates.bio = req.body.bio;
        
        if (Object.keys(profileUpdates).length > 0) {
          await storage.updateTeacherProfile(userId, profileUpdates);
        }
      }

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/profile/upload-image", authenticateToken, upload.single("image"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imagePath = `/uploads/${req.file.filename}`;
      
      // Update user profile image
      await storage.updateUser(req.user!.id, { profileImage: imagePath });

      res.json({ imagePath });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // KYC routes
  app.post("/api/kyc/submit", authenticateToken, upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const teacherProfile = await storage.getTeacherProfile(req.user!.id);
      if (!teacherProfile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }

      // Check if KYC already exists
      const existingKyc = await storage.getKycDocument(teacherProfile.id);
      if (existingKyc) {
        if (existingKyc.status === "pending") {
          return res.status(400).json({ message: "Your KYC is already under review. Please wait for approval." });
        } else if (existingKyc.status === "approved") {
          return res.status(400).json({ message: "Your KYC is already approved." });
        }
      }

      const kycData = insertKycDocumentSchema.parse({
        teacherId: teacherProfile.id,
        aadhaarCard: files.aadhaar?.[0]?.filename || null,
        panCard: files.pan?.[0]?.filename || null,
        selfie: files.selfie?.[0]?.filename || null,
      });

      await storage.createKycDocument(kycData);

      res.json({ message: "KYC submitted successfully" });
    } catch (error: any) {
      console.error("KYC submission error:", error);
      res.status(400).json({ message: error.message || "KYC submission failed" });
    }
  });

  // Requirements routes
  app.get("/api/requirements", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userType, subjects, location } = req.query;
      
      const requirements = await storage.getRequirements({
        userType: userType as "student" | "teacher",
        subjects: subjects ? (subjects as string).split(",") : undefined,
        location: location as string,
      });

      res.json(requirements);
    } catch (error) {
      console.error("Get requirements error:", error);
      res.status(500).json({ message: "Failed to get requirements" });
    }
  });

  app.post("/api/requirements", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requirementData = insertRequirementSchema.parse({
        ...req.body,
        userId: req.user!.id,
        userType: req.user!.userType,
      });

      const requirement = await storage.createRequirement(requirementData);
      res.status(201).json(requirement);
    } catch (error: any) {
      console.error("Create requirement error:", error);
      res.status(400).json({ message: error.message || "Failed to create requirement" });
    }
  });

  // Get user's own requirement
  app.get("/api/requirements/my", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requirement = await storage.getUserRequirement(req.user!.id);
      res.json(requirement);
    } catch (error) {
      console.error("Get user requirement error:", error);
      res.status(500).json({ message: "Failed to get user requirement" });
    }
  });

  app.delete("/api/requirements", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteRequirement(req.user!.id);
      res.json({ message: "Requirement deleted successfully" });
    } catch (error) {
      console.error("Delete requirement error:", error);
      res.status(500).json({ message: "Failed to delete requirement" });
    }
  });

  // Messages routes
  app.get("/api/messages/:userId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messages = await storage.getMessages(req.user!.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/messages/:userId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse({
        fromUserId: req.user!.id,
        toUserId: req.params.userId,
        content: req.body.content,
        attachment: req.body.attachment,
        attachmentType: req.body.attachmentType,
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Send message error:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  app.post("/api/messages/:messageId/like", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const message = await storage.toggleMessageLike(req.params.messageId);
      res.json(message);
    } catch (error: any) {
      console.error("Toggle message like error:", error);
      res.status(400).json({ message: error.message || "Failed to toggle like" });
    }
  });

  // Image upload for messages
  app.post("/api/upload/image", authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imagePath = `/uploads/${req.file.filename}`;
      
      // Schedule deletion after 2 hours
      setTimeout(() => {
        const filePath = path.join(process.cwd(), 'uploads', req.file!.filename);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
          else console.log('Auto-deleted image:', req.file!.filename);
        });
      }, 2 * 60 * 60 * 1000); // 2 hours

      res.json({ imagePath });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.get("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.post("/api/messages/:userId/read", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.markMessagesAsRead(req.params.userId, req.user!.id);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Mark messages read error:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Reviews routes
  app.get("/api/reviews/:userId", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviews(req.params.userId);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.post("/api/reviews", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        fromUserId: req.user!.id,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Create review error:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // Search routes
  app.get("/api/search/teachers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { subjects, location, verified } = req.query;
      
      const teachers = await storage.searchTeachers({
        subjects: subjects ? (subjects as string).split(",") : undefined,
        location: location as string,
        verified: verified === "true",
      });

      res.json(teachers);
    } catch (error) {
      console.error("Search teachers error:", error);
      res.status(500).json({ message: "Failed to search teachers" });
    }
  });

  // Search students (for teachers)
  app.get("/api/search/students", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { class: studentClass, location, verified } = req.query;
      
      const students = await storage.searchStudents({
        studentClass: studentClass as string,
        location: location as string,
        verified: verified === "true",
      });

      res.json(students);
    } catch (error) {
      console.error("Search students error:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  });

  app.get("/api/search/students", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { classes, location } = req.query;
      
      const students = await storage.searchStudents({
        classes: classes ? (classes as string).split(",") : undefined,
        location: location as string,
      });

      res.json(students);
    } catch (error) {
      console.error("Search students error:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  });

  // Location endpoints
  app.post("/api/user/location", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, fullAddress, street, city, state, pinCode } = req.body;
      const userId = (req as any).user.id;

      const updatedUser = await storage.updateUserLocation(userId, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        fullAddress,
        street,
        city,
        state,
        pinCode,
        isLocationVerified: true,
      });

      res.json({ message: "Location updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });



  app.get("/api/nearby-users/:radius", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const radius = parseFloat(req.params.radius) || 50;
      
      // Get current user to determine target user type and location
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.latitude || !currentUser?.longitude) {
        return res.json([]);
      }

      // Determine target user type (students see teachers, teachers see students)
      const targetUserType = currentUser.userType === 'student' ? 'teacher' : 'student';

      const currentLat = parseFloat(currentUser.latitude);
      const currentLng = parseFloat(currentUser.longitude);
      
      const nearbyUsers = await storage.getNearbyUsers(
        userId, 
        targetUserType, 
        currentLat, 
        currentLng, 
        radius
      );

      // Get additional profile data for each user
      const formattedUsers = await Promise.all(nearbyUsers.map(async (user) => {
        let subjects: string[] = [];
        let classInfo = '';
        let monthlyFee = 5000; // Default

        if (user.userType === 'teacher') {
          const teacherProfile = await storage.getTeacherProfile(user.id);
          subjects = teacherProfile?.subjects || [];
          monthlyFee = typeof teacherProfile?.monthlyFee === 'string' ? parseInt(teacherProfile.monthlyFee) : (teacherProfile?.monthlyFee || 5000);
        } else if (user.userType === 'student') {
          const studentProfile = await storage.getStudentProfile(user.id);
          classInfo = studentProfile?.class || '';
        }

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName || ''}`.trim(),
          profileImage: user.profileImage,
          city: user.city,
          state: user.state,
          pinCode: user.pinCode,
          fullAddress: user.fullAddress,
          latitude: user.latitude, // Include real GPS latitude
          longitude: user.longitude, // Include real GPS longitude
          distance: Math.round(user.distance * 10) / 10, // Round to 1 decimal place
          userType: user.userType,
          isVerified: user.isLocationVerified,
          monthlyFee: monthlyFee,
          rating: 4.5, // Default rating
          subjects: subjects,
          class: classInfo,
        };
      }));

      res.json(formattedUsers);
    } catch (error) {
      console.error("Get nearby users error:", error);
      res.status(500).json({ message: "Failed to get nearby users" });
    }
  });

  // Live users endpoint for nearby sharing
  app.get("/api/nearby/live-users", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { radius = 10 } = req.query; // radius in km
      
      // Get current user to determine target user type
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.latitude || !currentUser?.longitude) {
        return res.json([]);
      }

      // Determine target user type (students see teachers, teachers see students)
      const targetUserType = currentUser.userType === 'student' ? 'teacher' : 'student';

      const currentLat = parseFloat(currentUser.latitude);
      const currentLng = parseFloat(currentUser.longitude);
      
      const nearbyUsers = await storage.getNearbyLiveUsers(
        userId, 
        targetUserType, 
        currentLat, 
        currentLng, 
        parseFloat(radius as string)
      );

      res.json(nearbyUsers);
    } catch (error) {
      console.error("Get nearby live users error:", error);
      res.status(500).json({ message: "Failed to get nearby live users" });
    }
  });

  // User requests endpoints
  app.post("/api/user/request", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { receiverId, message } = req.body;
      const senderId = (req as any).user.id;

      const request = await storage.createUserRequest({
        senderId,
        receiverId,
        message,
        status: "pending",
      });

      res.json({ message: "Request sent successfully", request });
    } catch (error) {
      console.error("Create request error:", error);
      res.status(500).json({ message: "Failed to send request" });
    }
  });

  app.get("/api/user/requests/sent", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const requests = await storage.getSentRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Get sent requests error:", error);
      res.status(500).json({ message: "Failed to get sent requests" });
    }
  });

  app.get("/api/user/requests/received", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const requests = await storage.getReceivedRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Get received requests error:", error);
      res.status(500).json({ message: "Failed to get received requests" });
    }
  });

  app.patch("/api/user/request/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req as any).user.id;

      const request = await storage.updateRequestStatus(id, status, userId);

      if (status === "accepted") {
        // Send automatic message when request is accepted
        await storage.createMessage({
          fromUserId: userId,
          toUserId: request.senderId,
          content: "I am available now. You can start chatting with me!",
        });
      }

      res.json({ message: "Request updated successfully", request });
    } catch (error) {
      console.error("Update request error:", error);
      res.status(500).json({ message: "Failed to update request" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));
  
  // Serve attached assets (default profile images)
  app.use("/attached_assets", express.static("attached_assets"));

  // Dashboard stats endpoint
  app.get("/api/stats/dashboard", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Get some basic stats - you can expand this based on your needs
      const stats = {
        totalConnections: 0,
        totalMessages: 0, 
        totalReviews: 0,
        successRate: 85
      };

      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Recommendations endpoint
  app.get("/api/recommendations/:userType", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userType } = req.params;
      
      // Return empty array for now - you can implement actual recommendation logic
      const recommendations: any[] = [];

      res.json(recommendations);
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Recent activity endpoint
  app.get("/api/activity/recent", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Return empty array for now - you can implement actual activity tracking
      const activities: any[] = [];

      res.json(activities);
    } catch (error) {
      console.error("Get recent activity error:", error);
      res.status(500).json({ message: "Failed to get recent activity" });
    }
  });

  // Location update endpoint
  app.post("/api/auth/update-location", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { latitude, longitude, fullAddress, street, city, state, pinCode } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      // Update user location and mark as verified
      await storage.updateUserLocation(userId, { 
        latitude, 
        longitude, 
        fullAddress: fullAddress || `${latitude}, ${longitude}`,
        street: street || '',
        city: city || '',
        state: state || '',
        pinCode: pinCode || ''
      });

      res.json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Nearby live users endpoint
  app.get("/api/nearby/live-users", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const targetUserType = req.query.targetUserType as string || 'teacher';
      const radius = parseInt(req.query.radius as string) || 10;

      // Get current user to check their location
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.latitude || !currentUser?.longitude) {
        return res.json([]);
      }

      const currentLat = parseFloat(currentUser.latitude);
      const currentLng = parseFloat(currentUser.longitude);

      // Get users who are live sharing location
      const nearbyUsers = await storage.getNearbyLiveUsers(userId, targetUserType, currentLat, currentLng, radius);

      res.json(nearbyUsers);
    } catch (error) {
      console.error("Get nearby live users error:", error);
      res.status(500).json({ message: "Failed to get nearby users" });
    }
  });

  // Get user support messages
  app.get("/api/support/user-messages", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messages = await storage.getUserSupportMessages(req.user!.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user support messages:", error);
      res.status(500).json({ message: "Failed to fetch support messages" });
    }
  });

  // Support routes
  app.post("/api/support/message", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { subject, message } = req.body;
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const supportMessage = await storage.createSupportMessage({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName || ''}`.trim(),
        userEmail: user.email,
        subject: subject || "Support Request",
        message,
        status: "open"
      });

      res.json(supportMessage);
    } catch (error) {
      console.error("Error creating support message:", error);
      res.status(500).json({ message: "Failed to create support message" });
    }
  });

  // Admin middleware
  const authenticateAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      if (user.userType !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.user = user;
      next();
    });
  };

  // Admin routes
  // Create admin user (API endpoint for admin creation)
  app.post("/api/admin/create", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "Email, password, and first name are required" });
      }

      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = await storage.createUser({
        email,
        password: hashedPassword,
        userType: "admin",
        firstName,
        lastName: lastName || "",
        profileImage: "/attached_assets/IMG_20250731_105128_697_1754293953715.jpg"
      });

      res.status(201).json({ 
        message: "Admin created successfully", 
        admin: { ...adminUser, password: undefined } 
      });
    } catch (error: any) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user || user.userType !== "admin") {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // Get admin dashboard stats
  app.get("/api/admin/stats", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  // Get all users with details
  app.get("/api/admin/users", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userType, page = 1, limit = 50 } = req.query;
      const users = await storage.getAllUsersWithProfiles({
        userType: userType as "student" | "teacher" | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Get all teacher users with detailed information
  app.get("/api/admin/teachers", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teachers = await storage.getAllTeachersDetailed();
      res.json(teachers);
    } catch (error) {
      console.error("Get all teachers error:", error);
      res.status(500).json({ message: "Failed to get teachers" });
    }
  });

  // Get all support messages for monitoring
  app.get("/api/admin/support-messages", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messages = await storage.getAllSupportMessages();
      res.json(messages);
    } catch (error) {
      console.error("Get all support messages error:", error);
      res.status(500).json({ message: "Failed to get support messages" });
    }
  });

  // Get all conversations for monitoring (WhatsApp-like)
  app.get("/api/admin/conversations", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Get all conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  // Ban user
  app.post("/api/admin/users/:id/ban", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;
      
      await storage.banUser(userId, reason || "Admin action");
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  // Unban user
  app.post("/api/admin/users/:id/unban", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      
      await storage.unbanUser(userId);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Change admin password
  app.put("/api/admin/change-password", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Get admin user
      const admin = await storage.getUser(req.user!.id);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.user!.id, { password: hashedNewPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete user completely (admin function)
  app.delete("/api/admin/users/:id/delete", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const result = await storage.deleteUserCompletely(userId);
      
      if (result.success) {
        res.json({ 
          message: result.message,
          success: true 
        });
      } else {
        res.status(400).json({ 
          message: result.message,
          success: false 
        });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Reply to support message (admin function)
  app.put("/api/admin/support-messages/:id/reply", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messageId = req.params.id;
      const { adminReply } = req.body;
      
      if (!adminReply) {
        return res.status(400).json({ message: "Admin reply is required" });
      }
      
      const updatedMessage = await storage.replySupportMessage(messageId, adminReply);
      
      // Emit socket event to notify the user about the admin reply
      if (io) {
        io.emit("supportReply", {
          id: updatedMessage.id,
          subject: updatedMessage.subject,
          adminReply: updatedMessage.adminReply,
          repliedAt: updatedMessage.repliedAt,
          userId: updatedMessage.userId
        });
      }
      
      res.json({ message: "Reply sent successfully" });
    } catch (error) {
      console.error("Reply to support message error:", error);
      res.status(500).json({ message: "Failed to reply to support message" });
    }
  });

  // Get support conversations (WhatsApp-like)
  app.get("/api/admin/support-conversations", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversations = await storage.getSupportConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Support conversations error:", error);
      res.status(500).json({ message: "Failed to get support conversations" });
    }
  });

  // Get messages for specific user (support chat)
  app.get("/api/admin/support-conversations/:userId/messages", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getSupportMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Support messages error:", error);
      res.status(500).json({ message: "Failed to get support messages" });
    }
  });

  // Reply to support conversation
  app.post("/api/admin/support-conversations/:userId/reply", authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { message } = req.body;
      const adminId = req.user!.id;
      
      if (!message) {
        return res.status(400).json({ message: "Reply message is required" });
      }
      
      const result = await storage.addSupportReply(userId, adminId, message);
      res.json(result);
    } catch (error) {
      console.error("Support reply error:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  return httpServer;
}
