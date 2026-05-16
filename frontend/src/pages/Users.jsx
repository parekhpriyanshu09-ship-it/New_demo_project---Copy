import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { Input, Button, Modal, Select } from '../components/common'
import api from '../services/api'
import { getRoleLabel, ROLES } from '../utils/roleGuard'
import { formatDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import { UserPlus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Shield, Eye, Users as UsersIcon, UserCheck, Activity, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DEPARTMENTS = [
  { value: "DG Office", label: "DG Office" },
  { value: "CID Crime", label: "CID Crime" },
  { value: "Law & Order", label: "Law & Order" },
  { value: "Training", label: "Training" },
  { value: "TS & SCRB", label: "TS & SCRB" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, pages: 0 })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    role: ROLES.VIEWER,
    department: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/users', {
        params: { page: pagination.page, per_page: pagination.per_page, search: search.length > 2 ? search : '' },
      })
      setUsers(res.data.items || [])
      setPagination({
        page: res.data.page,
        per_page: res.data.per_page,
        total: res.data.total,
        pages: res.data.pages,
      })
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    if (pagination.page !== 1) {
      setPagination({ ...pagination, page: 1 })
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/users', addForm)
      toast.success('User created successfully!')
      setShowAddModal(false)
      setAddForm({ username: '', email: '', password: '', role: ROLES.VIEWER, department: '' })
      fetchUsers()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create user'
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, {
        role: addForm.role,
        department: addForm.department,
        email: addForm.email,
      })
      toast.success('User updated successfully!')
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update user'
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/api/admin/users/${userId}`)
      toast.success('User deleted successfully!')
      fetchUsers()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete user'
      toast.error(errorMsg)
    }
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setAddForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
    })
    setShowEditModal(true)
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1500px] mx-auto space-y-5 pb-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-none">
              User Management Directory
            </h1>
            <p className="text-slate-400 font-bold text-xs">
              Manage system access, roles, and departmental permissions.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl shadow-sm shadow-red-200 flex items-center justify-center gap-2 transition-all font-black text-sm tracking-tight whitespace-nowrap"
          >
            <UserPlus size={16} />
            Create New User
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UsersIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Directory</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{pagination.total}</h3>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Status</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{pagination.total}</h3>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">System Admins</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">-</h3>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Departments</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{DEPARTMENTS.length}</h3>
            </div>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-sm transition-all placeholder:text-slate-400"
            />
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">User Details</th>
                  <th className="pb-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Role Level</th>
                  <th className="pb-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="pb-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="pb-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Joined On</th>
                  <th className="pb-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <Activity className="animate-spin text-red-500 mx-auto mb-2" size={24} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading directory...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <UsersIcon className="text-slate-300 mx-auto mb-2" size={32} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No users found</span>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-slate-50/50 transition-all"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                              user.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' : 
                              'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {user.role === 'admin' ? <Shield size={16} /> : <Eye size={16} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800 tracking-tight">{user.username}</span>
                              <span className="text-xs font-bold text-slate-400">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-black uppercase tracking-widest ${
                            user.role === 'admin' ? 'bg-red-50 text-red-600' :
                            user.role === 'dg_office' ? 'bg-blue-50 text-blue-600' :
                            user.role === 'department_user' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs font-bold text-slate-500">
                          {user.department || '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs font-bold text-slate-400">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 hover:bg-white border border-transparent hover:border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                              title="Edit User"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 hover:bg-white border border-transparent hover:border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-red-600 transition-all"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Showing {users.length} of {pagination.total} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-black text-slate-700">
                  {pagination.page} / {pagination.pages}
                </div>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New User">
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input label="Username" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} placeholder="Enter username" required />
          <Input label="Email Address" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="admin@gujarat.gov.in" required />
          <Input label="Secure Password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder="••••••••" required />
          
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Access Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-bold transition-all"
            >
              <option value={ROLES.VIEWER}>Viewer (Read Only)</option>
              <option value={ROLES.DEPARTMENT_USER}>Department User</option>
              <option value={ROLES.DG_OFFICE}>DG Office</option>
              <option value={ROLES.ADMIN}>System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Department Assigned</label>
            <select
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-bold transition-all"
            >
              <option value="">No Department Assigned</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 transition-all disabled:opacity-50">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modify User Access">
        <form onSubmit={handleEditUser} className="space-y-4">
          <Input label="Username" value={addForm.username} disabled className="opacity-50 bg-slate-100 cursor-not-allowed" />
          <Input label="Email Address" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
          
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Access Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-bold transition-all"
            >
              <option value={ROLES.VIEWER}>Viewer (Read Only)</option>
              <option value={ROLES.DEPARTMENT_USER}>Department User</option>
              <option value={ROLES.DG_OFFICE}>DG Office</option>
              <option value={ROLES.ADMIN}>System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Department Assigned</label>
            <select
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-bold transition-all"
            >
              <option value="">No Department Assigned</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
