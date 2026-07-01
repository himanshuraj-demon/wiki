# IITGN Wiki – Indian Institute of Technology Gandhinagar Knowledge Base

IITGN Wiki is a modern, responsive, and secure university knowledge sharing platform inspired by Wikipedia. It acts as an internal portal for IIT Gandhinagar, allowing students, faculty, and administrators to collaboratively build, edit, and moderate articles.

---

## 🚀 Tech Stack

### Frontend
- **React 19** & **Vite** (Dev environment)
- **React Router v6** (Client routing & route protectors)
- **TailwindCSS v3** (Branded maroon & gold utility design)
- **Axios** (API requests)
- **React Query** (Query caching and mutate synchronization)
- **React Hook Form** (Form validation)
- **Framer Motion** (Clean UI transitions)
- **Lucide Icons** & **React Hot Toast** (Alert banners)

### Backend
- **Node.js** & **Express.js** (Server environment)
- **MongoDB** & **Mongoose** (Database schemas)
- **JWT (JSON Web Token)** (Security cookie/header verification)
- **Bcryptjs** (Secure password hashing)
- **Helmet**, **CORS**, **Express Mongo Sanitize** (NoSQL injection and XSS defenses)
- **Express Rate Limiter** (Brute-force protection)
- **Multer** & **Cloudinary** (Image uploading library with local static disk fallback)

---

## 🛠️ Installation & Setup

### Prerequisites
- Install **Node.js** (v18 or higher recommended)
- Install and run **MongoDB Community Server** locally (port `27017`)

### 1. Install all dependencies
In the root directory of the workspace, run the custom monorepo helper script:
```bash
npm run install-all
```
This automatically runs `npm install` inside both the `frontend/` and `backend/` directories.

### 2. Configure Environment Variables
We have created a pre-configured `.env` file in the `backend/` folder. You can add your Cloudinary details there if you wish to use remote storage; otherwise, it will automatically save files to the `backend/uploads/` directory on disk.

### 3. Seed Database
Seeding populates initial categories, mock departments, faculty members, and rich Markdown articles (Amalthea, hostels, CS departments, Student Gymkhana, etc.):
```bash
npm run seed
```

### 4. Run Development Servers
Open two terminal windows or run the following separately:

**Start the Backend API Server:** (port 5000)
```bash
npm run backend-dev
```

**Start the Frontend App Dev Server:** (port 3000)
```bash
npm run frontend
```
Go to [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔐 Default Login Credentials

Use these seeded accounts to test features and role privileges:

1. **System Administrator** (Manage roles, resolve issues, write announcements):
   - **Email:** `admin@iitgn.ac.in`
   - **Password:** `password123`

2. **Faculty Moderator** (Approve revisions, edit all articles, restore histories):
   - **Email:** `neeldhara.m@iitgn.ac.in`
   - **Password:** `password123`

3. **Student Editor** (Create draft articles, submit edits for moderation, comment, bookmark, and like):
   - **Email:** `student@iitgn.ac.in`
   - **Password:** `password123`

---

## ✨ Features Checklist

- [x] **Collapsible Sidebar Layout:** Replicates Wikipedia's left side navigation scheme.
- [x] **Global Search with Auto-Suggestions:** Real-time lookup by title, tags, or content.
- [x] **Feature-Rich Markdown Editor:** Split workspace supporting headings, lists, tables, callouts, and internal links (`[[Article Title]]`).
- [x] **Drag-and-Drop Image Uploader:** Automatically uploads dropped/pasted images and inserts their markdown code.
- [x] **LCS Diff Comparison Viewer:** View color-coded line-by-line differences between historical revisions.
- [x] **Threaded Comment Section (Talk Pages):** Discuss article facts with infinite nested replies and likes.
- [x] **Individual User Dashboard:** Track statistics, unread notifications, drafts, and bookmarks.
- [x] **Admin Analytics Dashboard:** Charts showing page growth, most viewed pages, top contributors, and revision log activity.
- [x] **Dark / Light Mode:** Sleek transitions toggled from the navbar.
