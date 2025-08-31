# Overview

Tutoro is a premium educational matchmaking platform with Instagram/Telegram/WhatsApp-like UI design that connects students with qualified teachers. The platform features modern, futuristic premium aesthetics with minimal spacing, stable design, and smooth functionality. It includes separate dashboards for students and teachers, real-time messaging, and location-based matching.

## Recent Updates (August 19, 2025)
- ✅ **NEW DATABASE & LOADING FIXES**: Migrated to fresh Neon PostgreSQL database with permanent user data storage
- ✅ Fixed all loading issues and stuck authentication screens with timeout protection
- ✅ Enhanced token validation and retry logic for smoother login experience
- ✅ Updated database connection: postgresql://neondb_owner:npg_Bt8aLTjUw4xq@ep-cool-darkness-aft5cuaf-pooler.c-2.us-west-2.aws.neon.tech/neondb
- ✅ Created fresh admin account with credentials: admin@tutoro.com / admin123
- ✅ Improved authentication loading with 10-second timeout protection to prevent infinite loading
- ✅ Enhanced login redirect mechanism with better state management
- ✅ Fixed cache invalidation for faster user data loading after login
- ✅ **BUDGET SYSTEM IMPLEMENTATION**: Added comprehensive fee/budget editing for both students and teachers
- ✅ Students can now set budget range (minimum and maximum) in profile settings
- ✅ Teachers can edit monthly fees in profile settings  
- ✅ Created students search API endpoint for teachers to find students with budget information
- ✅ Enhanced ProfileCard interface to display student budgets to teachers and teacher fees to students
- ✅ Updated find-premium page to show appropriate fee/budget information based on user type

## Previous Updates (August 14, 2025)
- ✅ Enhanced GPS location functionality with real-time accuracy monitoring
- ✅ Added high accuracy mode toggle with GPS precision indicators
- ✅ Created comprehensive location utility library with multiple geocoding services
- ✅ Improved direction functionality with better error handling and accuracy warnings
- ✅ Enhanced location prompts with detailed GPS feedback and address resolution
- ✅ Implemented location watching for real-time tracking capabilities
- ✅ Fixed Crown icon import error in main App component
- ✅ Updated location verification system with enhanced user experience
- ✅ Fixed API connection errors and database issues for seamless operation
- ✅ Implemented user-controlled location access (manual GPS activation)
- ✅ Removed all Hindi text and standardized interface to English
- ✅ Created seamless location setup without error notifications
- ✅ Enhanced nearby users display with direct messaging capabilities
- ✅ Fixed live location API endpoints and improved error handling
- ✅ Added "Set" status indicator on live location sharing interface
- ✅ Created comprehensive Settings page showing location status and user preferences
- ✅ Added Settings navigation to user menu for easy access
- ✅ Location sharing status now persists and shows "Set" badge when active
- ✅ Settings page displays current location details including city, state, coordinates
- ✅ Created LocationPinSetter component for map-like precise location setting
- ✅ Added two location sharing modes: Pin Location (fixed like maps) and Live Tracking
- ✅ Pin Location mode sets exact GPS position once without continuous tracking
- ✅ Live Tracking mode provides continuous location updates for movement
- ✅ Enhanced location accuracy display with status indicators (Excellent/Good/Fair)
- ✅ Improved Settings page with "Set Location Pin (Like Maps)" primary button
- ✅ Location settings now show comprehensive information about current pin and sharing status
- ✅ **DEBUGGING SESSION COMPLETED**: Resolved DATABASE_URL environment variable issue  
- ✅ Fixed database connection by creating PostgreSQL instance and configuring dotenv
- ✅ Modified dotenv configuration to prevent overriding system environment variables
- ✅ Implemented fallback database URL construction from PostgreSQL components
- ✅ Resolved port conflict issue by terminating conflicting Node.js processes
- ✅ Successfully pushed database schema with Drizzle Kit migrations
- ✅ Application now starts successfully with stable database connection on port 5000
- ✅ **MAP LOCATION ENHANCEMENTS**: Simplified location sharing to one-click operation
- ✅ Enhanced nearby users map to show complete addresses and exact place names
- ✅ Location pins now display full address details instead of just coordinates
- ✅ Streamlined Settings page with single "Open Map & Share Location" button
- ✅ Map automatically gets GPS location, saves address, and shows nearby users with full location details
- ✅ **UI IMPROVEMENTS**: Completely redesigned profile cards to show only essential information
- ✅ Simplified cards display: name, location, subjects, rating only (removed experience, price, success boxes)
- ✅ Compact card design with smaller spacing for better mobile experience
- ✅ Removed featured section from search interface as requested
- ✅ Implemented reciprocal matching - teachers now see nearby students in find page
- ✅ Enhanced grid layout to show more profiles per row (4 columns on desktop)
- ✅ **MAJOR BUG FIXES & UI IMPROVEMENTS (August 13, 2025)**:
- ✅ Fixed nearby users radius filtering to properly show users within selected distance
- ✅ Changed nearby users button behavior - direct message (green button) instead of connect request
- ✅ Kept connect button only for searched users in main find page
- ✅ Added photo sharing functionality in messages with image upload and display
- ✅ Fixed conversation names to show proper user names instead of requirements
- ✅ Enhanced real-time status indicators for online/offline users
- ✅ Added typing indicators and proper WebSocket connection handling
- ✅ Removed purple Tutoro logo from top navigation (kept only bottom logo)
- ✅ Used live users endpoint with proper reciprocal matching functionality
- ✅ **REQUEST PAGE FIXES (August 13, 2025)**: Fixed request counts display and verification badges
- ✅ Enhanced request page to show proper status details below colorful stats cards
- ✅ Made verification badges significantly larger (sm: 32px, md: 40px, lg: 48px) across requirements and messages
- ✅ Added message sending confirmation toast notifications for better user feedback
- ✅ Fixed RequestPremium page tabs and content display to show received/sent requests properly
- ✅ **SIGNUP FUNCTIONALITY DEBUGGING (August 14, 2025)**:
- ✅ Resolved DATABASE_URL environment variable issues with fallback configuration
- ✅ Fixed database schema missing columns: is_live_sharing, live_location_updated_at, hourly_rate
- ✅ Created support_messages table for user support functionality
- ✅ Student registration: Working perfectly with all required fields
- ✅ Teacher registration: Fixed and working after database schema corrections
- ✅ **COMPREHENSIVE ADMIN SYSTEM RECREATION (August 15, 2025)**:
- ✅ Recreated complete admin functionality from scratch with enhanced features
- ✅ Added admin user type back to database schema with proper authentication
- ✅ Created comprehensive admin API endpoints for all platform management
- ✅ Built modern admin dashboard with statistics and quick action cards
- ✅ Implemented admin control panel with advanced user management (ban/unban)
- ✅ Added support message monitoring with reply functionality
- ✅ Created WhatsApp-like chat monitoring interface for platform safety
- ✅ Built teacher management interface with detailed profile information
- ✅ Added admin authentication system with password change functionality
- ✅ Implemented separate admin routing isolated from regular user flow
- ✅ Created admin creation API endpoint for programmatic admin setup
- ✅ Added comprehensive storage methods for all admin operations
- ✅ **FEE SYSTEM MIGRATION & SETTINGS (August 14, 2025)**: Changed entire platform from hourly to monthly fee system
- ✅ Updated database schema: hourlyRate → monthlyFee field with default ₹5000/month
- ✅ Removed subjects display from profile cards - now shows only monthly fee
- ✅ Created comprehensive Settings page where users can edit phone, email, monthly fee, subjects
- ✅ Teachers can add/remove subjects and set monthly fees in Settings
- ✅ Fixed two-tab search system: "Nearest (50km)" with direct Message button, "All" with Connect button
- ✅ Fixed nearby users API endpoint to properly show users within 50km radius
- ✅ Enhanced ProfileCard interface to support monthly fee display
- ✅ Filters sidebar only shows for "All" tab, "Nearest" tab is clean and location-focused
- ✅ **SUBJECT DISPLAY FIX (August 15, 2025)**: Fixed subject visibility after profile updates
- ✅ Added subjects display back to teacher profile cards in find-premium page with badge format
- ✅ Added class display for student profile cards in find-premium page
- ✅ Fixed cache invalidation issue - profile updates now refresh all search results immediately
- ✅ Teachers' subject changes in settings now appear properly in all teacher/student search pages
- ✅ **VIEW DIRECTION ENHANCEMENT**: Added comprehensive View Direction button to Find-Premium page
- ✅ Implemented advanced direction functionality using location-utils library with precise GPS coordinates
- ✅ Added automatic distance calculation and display when opening directions
- ✅ Enhanced error handling for location permissions and GPS accuracy
- ✅ View Direction works exactly like requirements page - redirects to Google Maps with full details

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, utilizing Vite for build processes.
- **Routing**: Wouter for client-side routing with role-based navigation.
- **State Management**: TanStack Query for server state; custom hooks for local state.
- **UI Components**: Shadcn/ui, built on Radix UI primitives.
- **Styling**: Tailwind CSS, with custom design tokens for branding.
- **Form Handling**: React Hook Form, paired with Zod for validation.
- **UI/UX Decisions**: Professional basil green theme (#0b453a), custom blue tick verification badges, enhanced mobile responsiveness across all major pages, and redesigned sections with colorful gradient boxes for tips.

## Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API.
- **Real-time Communication**: WebSocket integration for live messaging.
- **Authentication**: JWT-based authentication with bcrypt for hashing.
- **File Handling**: Multer for KYC document uploads.
- **API Structure**: Modular route handlers with authentication and logging middleware.

## Database Layer
- **ORM**: Drizzle ORM (PostgreSQL dialect) for type-safe operations.
- **Schema Design**: Tables for users, profiles (student/teacher), KYC documents, requirements, messages, reviews, and user requests.
- **Database Provider**: Neon Database (PostgreSQL) with connection pooling.
- **Migrations**: Drizzle Kit for schema management.

## Authentication & Authorization
- **Session Management**: JWT tokens in localStorage.
- **Role-based Access**: Differentiated access for students and teachers.
- **KYC Verification**: Document verification system for teachers with status tracking.
- **Middleware Protection**: Authentication middleware for API routes.
- **Authentication Flow**: Dedicated full-page login/registration interfaces with enhanced registration fields for students (extended class options) and teachers (multi-subject selection, experience, bio).

## Real-time Features
- **WebSocket Server**: Integrated for instant messaging.
- **Message System**: Real-time chat with typing indicators and file attachments.
- **Connection Management**: User presence tracking.

## Location System
- **Location Verification**: GPS capture for users with detailed address storage.
- **Verification Badge**: Blue tick for location-verified users.
- **Find Functionality**: Redesigned teacher discovery with cards showing profile, verified status, subjects, experience, qualification, and location.
- **Direction Integration**: Google Maps for distance and directions.
- **Request Management**: New page for received/sent requests with accept/reject logic and automatic messaging.

## Navigation System
- **Fixed Navigation**: Permanent navigation bar visible on all pages.
- **Navigation Structure**: 5-section navigation: Home, Requirements, Messages, Find, Request.
- **Responsive Design**: Adapts for desktop (top) and mobile (bottom) with adjusted grid layouts.

# External Dependencies

## Core Technologies
- **Neon Database**: PostgreSQL database hosting.
- **Shadcn/ui**: Component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Type-safe database toolkit.

## Development Tools
- **Vite**: Frontend build tool.
- **TypeScript**: Static type checking.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: JavaScript bundler.

## File Upload & Storage
- **Multer**: Express middleware for file uploads.
- **Local File System**: Storage for KYC verification files.

## UI Components & Icons
- **Radix UI**: Headless UI components.
- **Lucide React**: Icon library.
- **React Hook Form**: Forms with validation.
- **Zod**: Schema validation.