# MyOKR - Full Stack OKR Management System

A modern OKR (Objectives and Key Results) management system built with React and Node.js.

## Tech Stack

### Frontend (client/)
- Vite
- React
- TypeScript
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- Zod
- HeadlessUI

### Backend (server/)
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT Authentication
- Zod Validation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   PORT=5000
   CLIENT_URL=http://localhost:5173
   DATABASE_URL="postgresql://user:password@localhost:5432/myokr?schema=public"
   JWT_SECRET=your-secret-key
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:5000`

## Development

- Frontend code is in the `client/src` directory
- Backend code is in the `server/src` directory
- Database schema is defined in `server/prisma/schema.prisma`

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@localhost:5432/myokr?schema=public"
JWT_SECRET=your-secret-key
```

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript code
- `npm start` - Start production server 