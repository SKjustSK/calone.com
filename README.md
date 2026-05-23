# Calone (Cal.com Clone)

A full-stack scheduling and booking web application that closely replicates Cal.com's design, user experience, and core functionality. 

This project was built for the Scaler SDE Intern Fullstack Assignment.

## 🚀 Tech Stack

- **Frontend:** React.js, TypeScript, Vite, Tailwind CSS, shadcn/ui, `date-fns` (with `date-fns-tz` for timezone manipulation)
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (via Prisma ORM)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL installed and running

### 1. Database Setup
1. Create a local PostgreSQL database (e.g., `calone_db`).
2. Navigate to the `server` directory and create a `.env` file:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://<your_user>:<your_password>@localhost:5432/calone_db?schema=public"
   ```

### 2. Backend Setup
Open a terminal and run the following commands:
```bash
cd server
npm install

# Push the Prisma schema to the database (creates tables)
npx prisma db push

# Seed the database with the default Admin user, event types, and dummy bookings
npm run seed

# Start the backend server
npm start
```

### 3. Frontend Setup
Open a new terminal and run:
```bash
cd client
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## ✨ Core Features Implemented
- **Event Types Management:** Create, edit, list, and delete event types with dynamically generated public booking URLs.
- **Availability Settings:** Configure working days, exact time slots, and the specific timezone in which your schedule is based.
- **Public Booking Page:** A seamless 3-column UI where the calendar intelligently maps the host's timezone to the booker's local timezone. Automatically detects and prevents double bookings.
- **Bookings Dashboard:** View past and upcoming bookings, complete with the ability to cancel them.

## 📝 Assumptions Made
- **Authentication:** Per the assignment guidelines ("No Login Required"), authentication is mocked. The backend assigns a default user (Admin) to all incoming requests via a global middleware in `server/src/index.ts`.
- **Timezone Handling:** It is assumed that the booker should always see time slots translated into their local browser time, while the availability limits strictly respect the host's custom timezone configuration. 
- **Soft Deletes:** If an event type is deleted by the host, it is actually 'archived' (soft deleted) rather than fully erased. This assumption preserves historical integrity so past bookings linked to that event type remain visible and do not crash the dashboard.
- **Strict Intervals:** Dummy data and scheduling logic strictly align to 15, 30, or 60 minute intervals to match Cal.com's actual behavior.
