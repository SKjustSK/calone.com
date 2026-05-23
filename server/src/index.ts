import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import eventRoutes from './routes/events';
import availabilityRoutes from './routes/availability';
import bookingRoutes from './routes/bookings';

const app = express();

app.use(cors());
app.use(express.json());

// Extend Express Request object to include our mocked user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Default authentication middleware.
 * Since the assignment states "No Login Required" and asks us to assume
 * a default user is logged in for the admin side, we mock the req.user here.
 * The ID matches the seeded admin user in our database.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  req.user = { id: '70a7e799-76a4-4528-8f0f-4448e5c4caf6', email: 'admin@calclone.com' };
  next();
});

app.use('/api/events', eventRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
