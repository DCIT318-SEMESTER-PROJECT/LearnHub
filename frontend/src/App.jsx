import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { MessagesProvider } from './context/MessagesContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AIChatPanel from './components/common/AIChatPanel';
import ChatWindow from './components/messages/ChatWindow';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import StudyGroups from './pages/StudyGroups';
import Profile from './pages/Profile';
import InstructorProfile from './pages/InstructorProfile';
import CreateCourse from './pages/CreateCourse';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MessagesProvider>
          <ToastProvider>
            <Router>
              <div className="App">
                <Navbar />
                <main style={{ minHeight: 'calc(100vh - 200px)' }}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:id" element={<CourseDetail />} />
                    <Route path="/instructor/:instructorId" element={<InstructorProfile />} />

                    {/* Logged-in routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Student-only */}
                    <Route
                      path="/study-groups"
                      element={
                        <ProtectedRoute requiredRole="Student">
                          <StudyGroups />
                        </ProtectedRoute>
                      }
                    />

                    {/* Instructor-only */}
                    <Route
                      path="/instructor/create-course"
                      element={
                        <ProtectedRoute requiredRole="Instructor">
                          <CreateCourse />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />

                {/* Global overlays */}
                <AIChatPanel />
                <ChatWindow />
              </div>
            </Router>
          </ToastProvider>
        </MessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;