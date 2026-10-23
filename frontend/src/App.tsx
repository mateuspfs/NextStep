import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import KnowledgeBase from './pages/KnowledgeBase'
import Processes from './pages/Processes'
import Training from './pages/Training'
import SubmitCaseStudy from './pages/SubmitCaseStudy'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import UsersManagement from './pages/admin/UsersManagement'
import ApprovalsManagement from './pages/admin/ApprovalsManagement'
import CategoriesManagement from './pages/admin/CategoriesManagement'
import CoursesManagement from './pages/admin/CoursesManagement'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="knowledge" element={<KnowledgeBase />} />
              <Route path="processes" element={<Processes />} />
              <Route path="training" element={<Training />} />
              <Route path="submit-case" element={<SubmitCaseStudy />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Admin routes */}
              <Route path="admin" element={<AdminPanel />} />
              <Route path="admin/users" element={<UsersManagement />} />
              <Route path="admin/approvals" element={<ApprovalsManagement />} />
              <Route path="admin/courses" element={<CoursesManagement />} />
              <Route path="admin/categories" element={<CategoriesManagement />} />
            </Route>
          </Routes>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
