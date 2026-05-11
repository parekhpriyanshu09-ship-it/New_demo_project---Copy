import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { Card, Badge, Input, Button, Modal, Select } from '../components/common'
import api from '../services/api'
import { getRoleLabel, ROLES } from '../utils/roleGuard'
import { formatDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import { UserPlus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Shield, Eye } from 'lucide-react'

const DEPARTMENTS = [
  { value: "DG Office", label: "DG Office" },
  { value: "CID Crime", label: "CID Crime" },
  { value: "Law & Order", label: "Law & Order" },
  { value: "Training", label: "Training" },
  { value: "TS & SCRB", label: "TS & SCRB" },
]

const roleColors = {
  admin: 'danger',
  dg_office: 'primary',
  department_user: 'warning',
  viewer: 'default',
}

export default function Admin() {
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
        params: { page: pagination.page, per_page: pagination.per_page },
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
    if (!confirm('Are you sure you want to delete this user?')) return

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-text-primary">Admin Panel</h1>
            <p className="text-text-secondary mt-1">Manage users and system settings</p>
          </div>

          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} />
            Add User
          </Button>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <Input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Department</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Created</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {user.role === 'admin' ? (
                              <Shield size={20} className="text-danger" />
                            ) : (
                              <Eye size={20} className="text-primary" />
                            )}
                          </div>
                          <span className="font-medium text-text-primary">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={roleColors[user.role] || 'default'}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {user.department || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.is_active ? 'success' : 'danger'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit size={18} className="text-text-secondary" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-text-secondary">
              Showing {users.length} of {pagination.total} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                <ChevronLeft size={18} />
              </Button>
              <span className="text-sm font-medium">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label="Username"
            value={addForm.username}
            onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
            placeholder="Enter username"
            required
          />

          <Input
            label="Email"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="Enter email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
            placeholder="Enter password"
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={ROLES.VIEWER}>Viewer</option>
              <option value={ROLES.DEPARTMENT_USER}>Department User</option>
              <option value={ROLES.DG_OFFICE}>DG Office</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Department</label>
            <select
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Add User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          <Input
            label="Username"
            value={addForm.username}
            disabled
            className="opacity-50"
          />

          <Input
            label="Email"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={ROLES.VIEWER}>Viewer</option>
              <option value={ROLES.DEPARTMENT_USER}>Department User</option>
              <option value={ROLES.DG_OFFICE}>DG Office</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Department</label>
            <select
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}