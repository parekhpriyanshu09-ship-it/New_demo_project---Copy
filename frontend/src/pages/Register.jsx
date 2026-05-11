import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { DEPARTMENTS } from '../utils/roleGuard'
import {
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Users,
  Lock,
  User,
  Shield,
  FileText,
  ScanLine,
  Check,
  Mail,
  Building,
  UserPlus
} from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        department: formData.department,
      })
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Registration failed. Please try again.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-[#fcfcfd] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex lg:w-1/2 p-4 xl:p-8 flex-col relative justify-center bg-[#fffafa]"
        >
          {/* Background Illustration / Elements */}
          <div className="absolute inset-0 z-0 mix-blend-multiply opacity-90 overflow-hidden pointer-events-none rounded-r-3xl">
            <img 
              src="/login-bg.png" 
              alt="Background" 
              className="w-full h-full object-cover object-center"
              style={{ filter: 'contrast(1.05) brightness(0.98)' }}
            />
          </div>

          <div className="relative z-10 w-full max-w-xl mx-auto xl:pl-4">
            {/* Header / Logo */}
            <div className="flex items-center gap-2.5 mb-4 xl:mb-5">
              <img
                src="/scrb-logo.png"
                alt="SCRB Logo"
                className="w-8 h-8 xl:w-10 xl:h-10 object-contain"
              />
              <img
                src="/Gujarat_Police.png"
                alt="Gujarat Police Logo"
                className="w-8 h-8 xl:w-10 xl:h-10 object-contain"
              />
              <div>
                <h1 className="text-[#0f172a] font-bold text-base xl:text-lg leading-tight">SCRB Gujarat</h1>
                <p className="text-slate-500 text-[10px] xl:text-xs font-medium leading-tight">State Crime Records Bureau</p>
              </div>
            </div>

            {/* Badge */}
            <div className="inline-block bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] xl:text-xs font-semibold mb-3 flex items-center gap-1.5 w-max border border-red-100">
              <ShieldCheck size={12} />
              Secure. Track. Simplify.
            </div>

            {/* Title */}
            <h2 className="text-[#0f172a] text-2xl xl:text-3xl font-bold leading-tight mb-2">
              Join the Police<br />
              <span className="text-[#dc2626]">Patrak System</span>
            </h2>
            
            <p className="text-slate-500 text-xs xl:text-[13px] max-w-md mb-5 leading-relaxed">
              Create your viewer account to track and monitor letter movements across departments.
            </p>

            {/* Features List */}
            <div className="space-y-3 xl:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <ShieldCheck size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-[11px] xl:text-[12px]">Secure & Reliable</h3>
                  <p className="text-slate-500 text-[9px] xl:text-[10px]">Enterprise grade security with read-only access</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <ScanLine size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-[11px] xl:text-[12px]">Real-time Tracking</h3>
                  <p className="text-slate-500 text-[9px] xl:text-[10px]">Track letter movements in real time</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <BarChart3 size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-[11px] xl:text-[12px]">Smart Dashboard</h3>
                  <p className="text-slate-500 text-[9px] xl:text-[10px]">Get insights and updates at your fingertips</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <Users size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-[11px] xl:text-[12px]">Department Access</h3>
                  <p className="text-slate-500 text-[9px] xl:text-[10px]">View patrak entries across multiple departments</p>
                </div>
              </div>

              {/* Highlighted Feature */}
              <div className="flex items-center justify-between p-2.5 xl:p-3 bg-red-50/80 border border-red-100 rounded-xl shadow-sm max-w-[340px] xl:max-w-[380px] mt-4 xl:mt-5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 xl:w-8 xl:h-8 bg-[#dc2626] rounded-full flex items-center justify-center text-white shrink-0 shadow-md shadow-red-200">
                    <UserPlus size={14} className="xl:w-4 xl:h-4" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-[10px] xl:text-[11px]">Viewer Registration</h3>
                    <p className="text-slate-500 text-[8px] xl:text-[9px]">Read-only access to track entries</p>
                  </div>
                </div>
                <div className="w-4 h-4 xl:w-5 xl:h-5 bg-white border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                  <Check size={10} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column (Form) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 flex items-center justify-center p-4 xl:p-6 bg-[#fcfcfd] z-10 overflow-y-auto lg:overflow-hidden"
        >
          <div className="w-full max-w-[380px] xl:max-w-[420px]">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center justify-center mb-4">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/scrb-logo.png"
                  alt="SCRB Logo"
                  className="w-10 h-10 object-contain"
                />
                <img
                  src="/Gujarat_Police.png"
                  alt="Gujarat Police Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h1 className="font-bold text-slate-800 text-base">SCRB Gujarat</h1>
            </div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[1.25rem] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-4 xl:p-5 border border-slate-100/60 w-full"
            >
              <div className="flex flex-col items-center mb-3 xl:mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="/scrb-logo.png"
                    alt="SCRB Logo"
                    className="w-12 h-12 xl:w-14 xl:h-14 object-contain"
                  />
                  <img
                    src="/Gujarat_Police.png"
                    alt="Gujarat Police Logo"
                    className="w-12 h-12 xl:w-14 xl:h-14 object-contain"
                  />
                </div>
                <h2 className="font-bold text-base xl:text-lg text-slate-800 mb-0.5 tracking-tight">Create Your Account</h2>
                <p className="text-slate-500 text-[9px] xl:text-[10px]">Register as a Viewer to track patrak</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2 xl:space-y-2.5">
                <div className="space-y-0.5">
                  <label className="block text-[10px] xl:text-[11px] font-bold text-slate-700 ml-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={13} />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      required
                      minLength={3}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-[10px] xl:text-[11px] focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[10px] xl:text-[11px] font-bold text-slate-700 ml-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={13} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-[10px] xl:text-[11px] focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[10px] xl:text-[11px] font-bold text-slate-700 ml-1">Department (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building size={13} />
                    </div>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-[10px] xl:text-[11px] focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[10px] xl:text-[11px] font-bold text-slate-700 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={13} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      required
                      minLength={8}
                      className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-[10px] xl:text-[11px] focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[10px] xl:text-[11px] font-bold text-slate-700 ml-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={13} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-[10px] xl:text-[11px] focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold text-[11px] xl:text-[12px] py-2 rounded-xl transition-all shadow-md shadow-red-200/50 flex items-center justify-center gap-1.5 mt-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <p className="text-center mt-4 xl:mt-5 text-slate-500 text-[10px] xl:text-[11px]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#dc2626] font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer Features */}
      <div className="bg-[#fcfcfd] border-t border-slate-200/60 py-2.5 px-4 z-20 shrink-0">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-2 items-center justify-between">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <Lock size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-[8px] xl:text-[9px] mb-0.5">Data Encryption</h4>
                <p className="text-slate-500 text-[7px] xl:text-[8px]">End-to-end encrypted</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <Shield size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-[8px] xl:text-[9px] mb-0.5">Role Based Access</h4>
                <p className="text-slate-500 text-[7px] xl:text-[8px]">Secure role management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <FileText size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-[8px] xl:text-[9px] mb-0.5">Audit Logs</h4>
                <p className="text-slate-500 text-[7px] xl:text-[8px]">Complete activity logs</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <ShieldCheck size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-[8px] xl:text-[9px] mb-0.5">100% Secure</h4>
                <p className="text-slate-500 text-[7px] xl:text-[8px]">Your data is protected</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-slate-400 text-[8px] xl:text-[9px] font-medium">© 2025 Patrak Tracking System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}