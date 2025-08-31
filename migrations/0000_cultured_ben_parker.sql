CREATE TYPE "public"."fee_type" AS ENUM('per_hour', 'per_day', 'per_month', 'per_subject');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."requirement_type" AS ENUM('online', 'offline', 'both');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('student', 'teacher', 'admin');--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"aadhaar_card" varchar,
	"pan_card" varchar,
	"selfie" varchar,
	"status" "kyc_status" DEFAULT 'pending',
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"attachment" varchar,
	"attachment_type" varchar,
	"is_read" boolean DEFAULT false,
	"is_liked" boolean DEFAULT false,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '30 days',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"user_type" "user_type" NOT NULL,
	"subjects" text[] NOT NULL,
	"classes" text[],
	"location" varchar NOT NULL,
	"city" varchar,
	"state" varchar,
	"pin_code" varchar,
	"street" varchar,
	"village" varchar,
	"type" "requirement_type" NOT NULL,
	"fee" numeric(8, 2),
	"fee_type" "fee_type",
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"class" varchar NOT NULL,
	"school_name" varchar NOT NULL,
	"city" varchar,
	"state" varchar,
	"pin_code" varchar,
	"street" varchar,
	"village" varchar,
	"budget_min" numeric(8, 2) DEFAULT '1.00',
	"budget_max" numeric(8, 2) DEFAULT '10.00',
	"preferred_subjects" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"user_name" varchar NOT NULL,
	"user_email" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'open',
	"admin_reply" text,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subjects" text[],
	"bio" text,
	"qualification" varchar NOT NULL,
	"experience" varchar,
	"city" varchar,
	"state" varchar,
	"pin_code" varchar,
	"street" varchar,
	"village" varchar,
	"age" integer,
	"gender" varchar,
	"kyc_status" "kyc_status" DEFAULT 'approved',
	"is_verified" boolean DEFAULT true,
	"rating" numeric(3, 2) DEFAULT '3.00',
	"student_count" integer DEFAULT 0,
	"monthly_fee" numeric(8, 2) DEFAULT '1.00',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"user_type" "user_type" NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar,
	"profile_image" varchar,
	"mobile" varchar,
	"is_online" boolean DEFAULT false,
	"last_seen" timestamp DEFAULT now(),
	"is_location_verified" boolean DEFAULT false,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"full_address" text,
	"street" varchar,
	"city" varchar,
	"state" varchar,
	"pin_code" varchar,
	"is_live_sharing" boolean DEFAULT false,
	"live_location_updated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_teacher_id_teacher_profiles_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;