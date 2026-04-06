import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'issues', label: 'Issue Management', icon: '📋' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'health', label: 'System Health', icon: '🖥️' },
];

const AdminDashboard = ({ onAddUser }) => {
    const { api, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [issues, setIssues] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [issuesRes, analyticsRes, usersRes] = await Promise.all([
                api.get('/issues'),
                api.get('/analytics'),
                api.get('/auth/users')
            ]);
            setIssues(issuesRes.data);
            setAnalytics(analyticsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/issues/${id}/status`, { status: newStatus });
            setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
            if (analytics) {
                fetchData(); // Refresh analytics on status change
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const escalatedIssues = issues.filter(i => i.is_escalated);
    const escalatedCount = escalatedIssues.length;

    // Chart data
    const barData = analytics ? [
        { name: 'Open', value: parseInt(analytics.summary.open_issues) || 0, fill: '#22c55e' },
        { name: 'Assigned', value: parseInt(analytics.summary.assigned_issues) || 0, fill: '#f59e0b' },
        { name: 'Resolved', value: parseInt(analytics.summary.resolved_issues) || 0, fill: '#3b82f6' },
        { name: 'Escalated', value: parseInt(analytics.summary.escalated_issues) || 0, fill: '#ef4444' },
    ] : [];

    const categoryData = analytics?.byCategory?.map(c => ({ name: c.category, value: parseInt(c.count) })) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50" style={{ marginTop: '-1rem' }}>
            {/* Sidebar */}
            <aside className="w-64 min-h-screen bg-white border-r border-gray-100 shadow-sm flex flex-col pt-6 fixed left-0 top-0 z-10" style={{ top: 0 }}>
                <div className="px-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">E</div>
                        <div>
                            <p className="font-bold text-primary text-sm">Admin Portal</p>
                            <p className="text-xs text-secondary">EnviroReport</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 pt-4 space-y-1">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-secondary hover:bg-gray-50 hover:text-primary'
                                }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${escalatedCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <span className="text-lg">🔔</span>
                        <div>
                            <p className="text-xs font-semibold text-secondary">Escalated</p>
                            <p className={`text-lg font-bold ${escalatedCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{escalatedCount}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 ml-64">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-primary capitalize">
                            {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                        <p className="text-xs text-secondary mt-0.5">
                            {analytics ? `${analytics.summary.total} total issues` : ''} · Last updated just now
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchData}
                            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-secondary hover:bg-gray-50 transition"
                        >
                            ↻ Refresh
                        </button>

                        {onAddUser && (
                            <button
                                onClick={onAddUser}
                                className="text-sm px-4 py-1.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition shadow-sm"
                            >
                                + Add User
                            </button>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-400 transition font-medium"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Logout
                        </button>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-xl hover:bg-gray-100 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                {escalatedCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {escalatedCount > 9 ? '9+' : escalatedCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-red-50">
                                        <h3 className="font-bold text-red-700">Escalated Issues ({escalatedCount})</h3>
                                        <button onClick={() => { setActiveTab('issues'); setShowNotifications(false); }} className="text-xs text-blue-600 hover:underline">View All</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                        {escalatedCount === 0 ? (
                                            <div className="px-5 py-8 text-center text-secondary text-sm">
                                                <div className="text-3xl mb-2">✅</div>
                                                No escalated issues
                                            </div>
                                        ) : escalatedIssues.map(issue => (
                                            <div key={issue.id} className="px-5 py-4 hover:bg-gray-50 transition">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-primary truncate">{issue.title}</p>
                                                        <p className="text-xs text-secondary mt-0.5 truncate">{issue.description}</p>
                                                        <div className="flex gap-2 mt-1.5">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">ESCALATED</span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{issue.category}</span>
                                                        </div>
                                                        {issue.remarks && (
                                                            <p className="text-xs text-gray-400 mt-1 italic truncate">Remarks: {issue.remarks}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-secondary ml-2 flex-shrink-0">{new Date(issue.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-6 space-y-6">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <GlassCard className="border-l-4 border-blue-400">
                                    <p className="text-xs text-secondary uppercase font-semibold tracking-wider mb-1">Total Issues</p>
                                    <p className="text-4xl font-bold text-primary">{analytics?.summary.total || 0}</p>
                                    <p className="text-xs text-secondary mt-1">All time</p>
                                </GlassCard>
                                <GlassCard className="border-l-4 border-green-400">
                                    <p className="text-xs text-secondary uppercase font-semibold tracking-wider mb-1">Open</p>
                                    <p className="text-4xl font-bold text-green-600">{analytics?.summary.open_issues || 0}</p>
                                    <p className="text-xs text-secondary mt-1">Needs attention</p>
                                </GlassCard>
                                <GlassCard className="border-l-4 border-yellow-400">
                                    <p className="text-xs text-secondary uppercase font-semibold tracking-wider mb-1">Assigned</p>
                                    <p className="text-4xl font-bold text-yellow-600">{analytics?.summary.assigned_issues || 0}</p>
                                    <p className="text-xs text-secondary mt-1">In progress</p>
                                </GlassCard>
                                <GlassCard className="border-l-4 border-red-400">
                                    <p className="text-xs text-secondary uppercase font-semibold tracking-wider mb-1">Escalated</p>
                                    <p className="text-4xl font-bold text-red-600">{analytics?.summary.escalated_issues || 0}</p>
                                    <p className="text-xs text-secondary mt-1">Needs priority</p>
                                </GlassCard>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Bar Chart */}
                                <GlassCard>
                                    <h3 className="font-bold text-primary mb-4">Issues by Status</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={barData} barSize={32}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {barData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </GlassCard>

                                {/* Pie Chart */}
                                <GlassCard>
                                    <h3 className="font-bold text-primary mb-4">Issues by Category</h3>
                                    {categoryData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {categoryData.map((_, index) => (
                                                        <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-56 flex items-center justify-center text-secondary">No data yet</div>
                                    )}
                                </GlassCard>
                            </div>

                            {/* Escalated Issues Panel */}
                            {escalatedCount > 0 && (
                                <div>
                                    <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        Escalated Issues Requiring Attention
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {escalatedIssues.map(issue => (
                                            <div key={issue.id} className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-primary text-sm truncate flex-1">{issue.title}</h4>
                                                    <span className="ml-2 flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full uppercase">Escalated</span>
                                                </div>
                                                <p className="text-xs text-secondary mb-3 line-clamp-2">{issue.description}</p>
                                                {issue.remarks && (
                                                    <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg mb-3 border border-yellow-100">
                                                        <strong>Remarks:</strong> {issue.remarks}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-secondary">{issue.category} · {new Date(issue.created_at).toLocaleDateString()}</span>
                                                    <select
                                                        value={issue.status}
                                                        onChange={(e) => handleStatusUpdate(issue.id, e.target.value)}
                                                        className="text-xs p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="Verified">Verified</option>
                                                        <option value="Assigned">Assigned</option>
                                                        <option value="Resolved">Resolved</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity */}
                            {analytics?.recentActivity?.length > 0 && (
                                <GlassCard>
                                    <h3 className="font-bold text-primary mb-4">Recent Activity</h3>
                                    <div className="space-y-3">
                                        {analytics.recentActivity.map(item => (
                                            <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.status === 'Open' ? 'bg-green-500' : item.status === 'Resolved' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                                <p className="text-sm text-primary flex-1 truncate">{item.title}</p>
                                                <span className="text-xs text-secondary flex-shrink-0">{new Date(item.created_at).toLocaleDateString()}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.status === 'Open' ? 'bg-green-100 text-green-700' : item.status === 'Resolved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}
                        </>
                    )}

                    {/* ISSUE MANAGEMENT TAB */}
                    {activeTab === 'issues' && (
                        <div className="space-y-4">
                            <div className="flex gap-3 flex-wrap">
                                {['Total: ' + issues.length, 'Open: ' + issues.filter(i => i.status === 'Open').length, 'Escalated: ' + escalatedCount].map((stat, i) => (
                                    <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-semibold text-secondary shadow-sm">{stat}</div>
                                ))}
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-[11px] text-secondary uppercase tracking-wider">
                                            <tr>
                                                <th className="px-5 py-3">ID</th>
                                                <th className="px-5 py-3">Title</th>
                                                <th className="px-5 py-3">Category</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3">Priority</th>
                                                <th className="px-5 py-3">Escalated</th>
                                                <th className="px-5 py-3">Remarks</th>
                                                <th className="px-5 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-sm">
                                            {issues.map(issue => (
                                                <tr key={issue.id} className={`hover:bg-gray-50 transition-colors ${issue.is_escalated ? 'bg-red-50/50' : ''}`}>
                                                    <td className="px-5 py-3 text-xs text-secondary">#{issue.id}</td>
                                                    <td className="px-5 py-3 font-medium max-w-[180px] truncate" title={issue.title}>{issue.title}</td>
                                                    <td className="px-5 py-3 text-secondary">{issue.category}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${issue.status === 'Open' ? 'bg-green-100 text-green-700' : issue.status === 'Resolved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {issue.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-secondary">{issue.priority}</td>
                                                    <td className="px-5 py-3">
                                                        {issue.is_escalated ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full uppercase">YES</span>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 max-w-[150px] truncate text-xs text-gray-500 italic">{issue.remarks || '—'}</td>
                                                    <td className="px-5 py-3">
                                                        <select
                                                            value={issue.status}
                                                            onChange={(e) => handleStatusUpdate(issue.id, e.target.value)}
                                                            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                                        >
                                                            <option value="Open">Open</option>
                                                            <option value="Verified">Verified</option>
                                                            <option value="Assigned">Assigned</option>
                                                            <option value="Resolved">Resolved</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USER MANAGEMENT TAB */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h3 className="font-bold text-primary">All Users ({users.length})</h3>
                                <div className="flex gap-2 text-xs">
                                    {[...new Set(users.map(u => u.role))].map(r => (
                                        <span key={r} className="px-2 py-1 bg-gray-100 rounded-full text-secondary font-medium capitalize">{r}: {users.filter(u => u.role === r).length}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[11px] text-secondary uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3">ID</th>
                                            <th className="px-5 py-3">Name</th>
                                            <th className="px-5 py-3">Email</th>
                                            <th className="px-5 py-3">Phone</th>
                                            <th className="px-5 py-3">Role</th>
                                            <th className="px-5 py-3">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3 text-xs text-secondary">#{user.id}</td>
                                                <td className="px-5 py-3 font-semibold">{user.name}</td>
                                                <td className="px-5 py-3 text-blue-600">{user.email}</td>
                                                <td className="px-5 py-3 text-secondary">{user.phone}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'staff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-secondary text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SYSTEM HEALTH TAB */}
                    {activeTab === 'health' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassCard className="border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-secondary text-sm uppercase tracking-wide font-semibold">API Status</h3>
                                        <p className="text-2xl font-bold text-green-600 mt-1">Operational</p>
                                        <p className="text-xs text-secondary mt-1">All systems GO</p>
                                    </div>
                                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </GlassCard>
                            <GlassCard className="border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-secondary text-sm uppercase tracking-wide font-semibold">Database</h3>
                                        <p className="text-2xl font-bold text-green-600 mt-1">Connected</p>
                                        <p className="text-xs text-secondary mt-1">MySQL / MariaDB</p>
                                    </div>
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                </div>
                            </GlassCard>
                            <GlassCard className="border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-secondary text-sm uppercase tracking-wide font-semibold">Version</h3>
                                        <p className="text-2xl font-bold text-blue-600 mt-1">v1.0.2</p>
                                        <p className="text-xs text-secondary mt-1">Latest stable</p>
                                    </div>
                                    <span className="text-xs text-blue-500 font-bold">UP TO DATE</span>
                                </div>
                            </GlassCard>
                            <GlassCard>
                                <h3 className="font-bold text-primary mb-3">Platform Stats</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-secondary">Total Users</span>
                                        <span className="font-bold">{users.length}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-secondary">Total Issues</span>
                                        <span className="font-bold">{issues.length}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-secondary">Resolution Rate</span>
                                        <span className="font-bold text-blue-600">
                                            {issues.length > 0 ? Math.round((issues.filter(i => i.status === 'Resolved').length / issues.length) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-secondary">Escalation Rate</span>
                                        <span className="font-bold text-red-600">
                                            {issues.length > 0 ? Math.round((escalatedCount / issues.length) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
