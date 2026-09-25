import React from 'react';
import { useAuth } from '../context/AuthContext';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';

function Dashboard() {
  const { user } = useAuth();
  
  // Instructors get their own dashboard
  if (user?.role === 'Instructor' || user?.isInstructor) {
    return <InstructorDashboard />;
  }
  
  // Everyone else sees the student dashboard
  return <StudentDashboard />;
}

export default Dashboard;