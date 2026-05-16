import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Letters from './pages/Letters'
import EntryDetail from './pages/EntryDetail'
import Scanner from './pages/Scanner'
import Logs from './pages/Logs'
import Admin from './pages/Admin'
import Users from './pages/Users'
import TrackPage from './pages/TrackPage'
import Reports from './pages/Reports'
import TrackMyTapal from './pages/TrackMyTapal'
import HowItWorks from './pages/HowItWorks'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1565C0',
              color: '#fff',
              borderRadius: '10px',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track-patrak" element={<TrackPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/letters" element={<ProtectedRoute><Letters /></ProtectedRoute>} />
          <Route path="/without-qr-code" element={<ProtectedRoute><Letters /></ProtectedRoute>} />
          <Route path="/letters/:id" element={<ProtectedRoute><EntryDetail /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/track-my-tapal" element={<ProtectedRoute><TrackMyTapal /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/how-it-works" element={<ProtectedRoute><HowItWorks /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
