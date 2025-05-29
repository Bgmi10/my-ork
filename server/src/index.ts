import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import okrRoutes from './routes/okr.routes';
import departmentRoutes from './routes/department.routes';
import inviteRoutes from './routes/invite.routes';
import teamRoutes from './routes/team.routes';
import organizationRouter from './routes/organization.routes';
import { authMiddleware } from './middleware/authMiddleware';
import prisma from './prisma';
import aiokrSuggestionRoutes from './routes/aiokrSuggestionRoutes';
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_DEV_URL,
  credentials: true,
}));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/okrs', okrRoutes);
app.use('/api/v1/department', departmentRoutes);
app.use('/api/v1/invite', inviteRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/organization', authMiddleware, organizationRouter);

app.post("/api/v1/user", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const { email: currentUserEmail } = req.user;

    if (email === currentUserEmail) {
      return res.status(400).json({ message: "You cannot invite yourself." });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        team: {
          include: {
            department: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    if (!user.team) {
      return res.status(400).json({ message: "User is not assigned to a team." });
    }

    const department = user.team.department;
    if (!department) {
      return res.status(400).json({ message: "Team is not assigned to a department." });
    }

    const organization = department.organization;
    if (!organization) {
      return res.status(400).json({ message: "Department is not part of an organization." });
    }

    // Optional: If you want to return this nested info
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: {
          id: user.team.id,
          name: user.team.name,
        },
        department: {
          id: department.id,
          name: department.name,
        },
        organization: {
          id: organization.id,
          name: organization.name,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.use('/api/v1/ai', authMiddleware, aiokrSuggestionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 