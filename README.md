# LearnHub 📚  
*A Collaborative Web-Based Learning Platform*

## 🚀 Overview
LearnHub is a web-based platform designed to help **students and self-learners** access organized, high-quality learning resources and collaborate with peers. It combines **course browsing, study groups, progress tracking, and real-time communication** into one seamless experience.

## 🛠️ Tech Stack
- **Frontend:** Blazor WebAssembly  
- **Backend API:** ASP.NET Core Web API  
- **Database:** Microsoft SQL Server + Entity Framework Core  
- **Real-time Features:** SignalR (for group chat & notifications)

## 🎯 Problem Statement
Learners often struggle to find affordable, ad-free platforms that combine structured resources with community-driven motivation. LearnHub solves this by offering:
- Centralized, high-quality learning materials  
- Real-time study group collaboration  
- Progress tracking with badges and achievements  

## 👩‍💻 Core Features
- **Dashboard:** Personalized homepage with enrolled courses, activity, and deadlines  
- **Course Browsing:** Search/filter courses by category, difficulty, or rating  
- **Study Groups:** Create or join groups with SignalR-powered live chat  
- **Progress Tracker:** Visual completion stats, quiz scores, and badges  

## 📂 Project Structure
LearnHub/
├── backend/                      # Backend API (ASP.NET Core)
│   ├── LearnHub.API/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── DTOs/
│   │   ├── Services/
│   │   ├── Middleware/
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── LearnHub.Core/
│   │   ├── Entities/
│   │   ├── Interfaces/
│   │   └── Enums/
│   ├── LearnHub.Infrastructure/
│   │   ├── Data/
│   │   ├── Repositories/
│   │   └── Migrations/
│   └── LearnHub.sln
├── frontend/                     # React frontend (JavaScript)
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/                 # API service calls
│   │   │   ├── axiosConfig.js
│   │   │   ├── authAPI.js
│   │   │   ├── coursesAPI.js
│   │   │   └── groupsAPI.js
│   │   ├── assets/              # Images, fonts, etc.
│   │   │   ├── images/
│   │   │   └── styles/
│   │   ├── components/          # Reusable components
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Loader.jsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── StreakCard.jsx
│   │   │   │   └── ProgressCard.jsx
│   │   │   ├── courses/
│   │   │   │   ├── CourseList.jsx
│   │   │   │   ├── CourseCard.jsx
│   │   │   │   ├── CourseDetail.jsx
│   │   │   │   └── CourseFilters.jsx
│   │   │   └── study-groups/
│   │   │       ├── GroupList.jsx
│   │   │       ├── GroupChat.jsx
│   │   │       └── CreateGroup.jsx
│   │   ├── context/             # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useCourses.js
│   │   │   └── useSignalR.js
│   │   ├── pages/               # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── StudyGroups.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/            # Business logic services
│   │   │   ├── authService.js
│   │   │   └── courseService.js
│   │   ├── utils/               # Utility functions
│   │   │   ├── constants.js
│   │   │   ├── validators.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js
├── docs/                         # Project documentation
│   ├── assignment1/
│   │   └── LearnHub_Assignment1.docx
│   ├── api/
│   └── wireframes/
├── scripts/                      # Build/deployment scripts
├── docker-compose.yml
├── .gitignore
└── README.md


## 👥 Team Roles
- Project Manager  
- Backend Developers (API & Database)  
- Frontend Developers (Blazor)  
- UI/UX Designers  
- Database Architect  
- SignalR Specialist  
- QA & Documentation Lead  
- Compliance Manager  


## ⚙️ Getting Started
### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)  
- [SQL Server](https://www.microsoft.com/sql-server)  
- [Node.js](https://nodejs.org/) (for frontend tooling)  

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/LearnHub.git
   cd LearnHub
