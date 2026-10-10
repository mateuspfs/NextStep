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
import AdminPanel from './pages/AdminPanel'
import SubmitCaseStudy from './pages/SubmitCaseStudy'
import ApprovalPanel from './pages/ApprovalPanel'

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
              <Route path="admin" element={<AdminPanel />} />
              <Route path="approvals" element={<ApprovalPanel />} />
            </Route>
          </Routes>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
