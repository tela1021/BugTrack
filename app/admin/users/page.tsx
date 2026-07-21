'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, MoreVertical, Loader2, X } from "lucide-react";
import Link from "next/link";
import { getUsers, updateUser, createUser, resetPassword } from '@/actions/users';
import type { User } from '@prisma/client';
import { useToast } from '@/components/ToastProvider';

type ManagedUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

export default function UsersAdmin() {
    const toast = useToast();
    // ... (Keep existing state)
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
    const [newPassword, setNewPassword] = useState(''); // For reset

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createData, setCreateData] = useState<{ name: string; email: string; password: string; role: 'ADMIN' | 'MEMBER' }>({ name: '', email: '', password: '', role: 'MEMBER' });

    async function loadUsers() {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
    }

    useEffect(() => {
        loadUsers();
    }, []);

    const handleEditClick = (user: ManagedUser) => {
        setEditingUser(user);
        setEditName(user.name || '');
        setEditRole(user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
        setNewPassword(''); // Reset
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        // Update basic info
        const res = await updateUser(editingUser.id, { name: editName, role: editRole });

        // Update password if provided
        if (newPassword.trim()) {
            await resetPassword(editingUser.id, newPassword);
        }

        if (res.success) {
            await loadUsers();
            setEditingUser(null);
            toast.success('Пользователь обновлён');
        } else {
            toast.error(res.error || 'Не удалось обновить пользователя');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createUser({
            name: createData.name,
            email: createData.email,
            password: createData.password,
            role: createData.role
        });

        if (res.success) {
            await loadUsers();
            setIsCreateOpen(false);
            setCreateData({ name: '', email: '', password: '', role: 'MEMBER' });
            toast.success('Пользователь создан');
        } else {
            toast.error(res.error || 'Не удалось создать пользователя');
        }
    };

    return (
        <div className="container">
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', marginBottom: '24px' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Users & Roles</h1>
                <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                    <UserPlus size={16} /> Create User
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" size={24} />
                </div>
            ) : (
                <div className="glass" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                                <th style={{ padding: '12px 16px' }}>User</th>
                                <th style={{ padding: '12px 16px' }}>Email</th>
                                <th style={{ padding: '12px 16px' }}>Role</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderTop: '1px solid var(--border)', fontSize: '14px' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{user.name}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)' }}>{user.email}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            background: user.role === 'ADMIN' ? 'var(--foreground)' : 'var(--secondary)',
                                            color: user.role === 'ADMIN' ? 'var(--background)' : 'var(--foreground)',
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <button
                                            className="btn glass"
                                            style={{ padding: '4px' }}
                                            onClick={() => handleEditClick(user)}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                }} onClick={() => setEditingUser(null)}>
                    <div className="glass" style={{ width: '400px', padding: '24px', background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Edit User</h2>
                            <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Full Name</label>
                                <input
                                    className="input"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Role</label>
                                <select
                                    className="input"
                                    value={editRole}
                                    onChange={e => setEditRole(e.target.value as 'ADMIN' | 'MEMBER')}
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Reset Password <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(Optional)</span></label>
                                <input
                                    className="input"
                                    type="password"
                                    placeholder="Enter new password to reset"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <button type="button" className="btn glass" onClick={() => setEditingUser(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                }} onClick={() => setIsCreateOpen(false)}>
                    <div className="glass" style={{ width: '400px', padding: '24px', background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Create New User</h2>
                            <button onClick={() => setIsCreateOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Full Name</label>
                                <input
                                    className="input"
                                    value={createData.name}
                                    onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    value={createData.email}
                                    onChange={e => setCreateData({ ...createData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Initial Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={createData.password}
                                    onChange={e => setCreateData({ ...createData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Role</label>
                                <select
                                    className="input"
                                    value={createData.role}
                                    onChange={e => setCreateData({ ...createData, role: e.target.value as 'ADMIN' | 'MEMBER' })}
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <button type="button" className="btn glass" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
