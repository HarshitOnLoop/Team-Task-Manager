APEX TASK - Team Task Manager

APEX TASK is a professional, high-performance, full-stack team collaboration and task tracking web application. Built with a premium, state-of-the-art white glassmorphism design system, it delivers an intuitive user experience with solid security features.

=========================================
KEY FEATURES
=========================================

* Double-Role RBAC Security: Clear boundary privileges separating System Admins and Project Members.
  - Admin: Create and manage projects, invite/remove members, create/assign/delete tasks, and edit all details.
  - Member: Access designated projects, view tasks assigned to them, and update status of their tasks.
* Interactive Kanban Task Board: Columns for "To Do", "In Progress", "Review", and "Done" with real-time status updates and modal actions.
* Intelligent Analytical Dashboard: High-level telemetry displaying Project Milestones (relative completions) and upcoming schedules.
* Hybrid Data Layer (SQLite / PostgreSQL): Uses Sequelize with SQLite locally and shifts dynamically to PostgreSQL in production via environment configurations.

=========================================
TECH STACK
=========================================

* Frontend: React (Vite), Lucide Icons, Premium Custom styling (No Tailwind, fully structured custom light CSS).
* Backend: Node.js, Express, Sequelize ORM, JWT authentication, Bcryptjs password hashing, Express-cors.
* Database: SQLite (Development), PostgreSQL (Production/Railway).

=========================================
INSTALLATION & LOCAL SETUP
=========================================

1. Clone the repository:
   git clone <your-repo-url>
   cd ASS

2. Configure Environment Variables:
   Create a .env file in the root directory:
   PORT=5050
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development

3. Install & Run Build:
   npm run build

4. Start the Server:
   npm start

   Open http://localhost:5050 in your web browser.

=========================================
DEPLOYMENT TO RAILWAY
=========================================

This repository is optimized for one-click production deployment on Railway:

1. Connect your GitHub repository to Railway.
2. Under Variables, define JWT_SECRET and NODE_ENV=production.
3. Provision a PostgreSQL Database in Railway. Railway automatically injects the DATABASE_URL variable.
4. Set the Build Command to "npm run build" and Start Command to "npm start".
5. Deploy! The application will dynamically migrate the tables to PostgreSQL and serve the React assets.
