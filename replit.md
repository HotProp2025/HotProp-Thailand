# HotProp - Real Estate Platform

## Overview
HotProp is a mobile-first real estate platform connecting property owners directly with buyers and renters, eliminating agent fees. It features listings for various property types (houses, apartments, land, townhouses, pool villas) supporting both buying and renting transactions. The platform aims to provide a seamless, direct connection experience for real estate transactions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Mobile-first responsive design using React with TypeScript.
- **UI Framework**: shadcn/ui components built on Radix UI primitives for a consistent design system.
- **Styling**: Tailwind CSS with a custom color scheme and Inter font family.
- **State Management**: TanStack Query for server state management and caching.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod validation for type-safe form management.
- **Layout Pattern**: Mobile-focused layout with bottom navigation and header components.

### Backend Architecture
- **Express.js API**: RESTful API server developed with TypeScript.
- **Database ORM**: Drizzle ORM for type-safe database operations.
- **Authentication**: JWT-based authentication with bcrypt password hashing.
- **Middleware**: Custom logging middleware for API request tracking.
- **Build System**: Vite for frontend bundling, esbuild for backend compilation.

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless database.
- **Schema Design**: Comprehensive property schema supporting multiple property types, user management, favorites, reports, and search functionality.
- **Connection Pooling**: Neon serverless pool for efficient database connections.
- **Migrations**: Drizzle Kit for database schema migrations.

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication using JSON Web Tokens.
- **Password Security**: bcrypt hashing for secure password storage.
- **Protected Routes**: Middleware-based route protection for authenticated endpoints.
- **User Roles**: Support for different user roles and subscription tiers.

### Feature Specifications
- **Direct Owner-Buyer/Renter Connection**: Core functionality enabling direct communication.
- **Comprehensive Property Listings**: Support for multiple property types and transaction types (buy/rent).
- **Advanced Search & Filtering**: Dynamic filtering based on user selections, property type, transaction type, price, and property specifications (e.g., land/build size, amenities).
- **In-App Messaging**: Real-time messaging system for communication between users, replacing email-based contact.
- **User Profiles & Requirements**: Functionality for users to manage profiles and create multiple buyer requirements.
- **Admin Management**: Dedicated admin interface for managing service providers, ensuring quality control.
- **Google Maps Integration**: Clickable addresses on listings linking to Google Maps.
- **Amenity Selection**: Comprehensive multi-select amenity dropdowns for both properties and buyer requirements.
- **Real Estate Agent Prohibition**: Registration validation to ensure only property owners and seekers register.
- **Branding & UI/UX**: Consistent logo, welcome messages, and mobile-first responsive design throughout the application.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting for the production database.
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL.

### UI & Styling
- **Radix UI**: Headless component library for accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind.

### Development Tools
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Ensures type safety across the frontend and backend.
- **React Query**: Used for server state management and data fetching.
- **React Hook Form**: Facilitates form handling with validation.
- **Zod**: Provides runtime type validation and schema definition.

### Authentication & Security
- **jsonwebtoken**: For JWT token generation and verification.
- **bcrypt**: Used for password hashing and verification.
- **nodemailer**: SMTP email service for sending verification and welcome emails.

### Email Verification System (August 18, 2025)
- **Database Schema**: Added emailVerificationToken and emailVerificationExpires fields to users table
- **Email Templates**: Professional branded emails for verification and welcome messages
- **Backend Routes**: `/api/auth/verify-email` and `/api/auth/resend-verification` endpoints
- **Frontend Pages**: Dedicated email verification page with success/error states
- **Smart Configuration**: System works with or without SMTP credentials (graceful degradation)
- **Login Protection**: Users must verify email before accessing the platform (when SMTP configured)

### Weekly Listing Validation System (August 19, 2025)
- **Automated Validation**: Weekly checks (Mondays 9 AM) and daily expiration monitoring for properties and buyer requirements
- **Database Schema**: Added validation tracking fields (lastValidationReminder, validationToken, validationExpires, validationResponseReceived) to both properties and buyer requirements tables
- **Email & In-App Notifications**: Sends both branded email reminders and in-app notifications asking users to confirm listing validity within 24 hours
- **Auto-Deactivation**: Automatically deactivates listings that don't respond within 24 hours (items are not deleted, just hidden)
- **Manual Reactivation**: Users can easily reactivate deactivated listings through their dashboard with one-click functionality
- **Validation Routes**: `/api/validate-listing` for token-based validation and reactivation endpoints for manual recovery
- **Cron Jobs**: Background scheduler runs validation checks and expiry monitoring to maintain platform freshness
- **User Interface**: Status indicators and reactivation buttons integrated into property and requirement management pages

### Hosting & Deployment
- **Replit**: Utilized for development and deployment.
- **Node.js**: The runtime environment for backend services.