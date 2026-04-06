import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
    const colors = {
        Open: 'bg-emerald-100 text-emerald-700',
        Assigned: 'bg-amber-100 text-amber-700',
        Resolved: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

const StaffDashboard = () => {
    const { api, user } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState({});
    const [updating, setUpdating] = useState({});
    const [successId, setSuccessId] = useState(null);
    const [filter, setFilter] = useState('all');

    // Get image URL from API endpoint
    const getImageUrl = (issueId) => {
        if (!issueId) return '';
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        return `${baseUrl}/issues/${issueId}/image`;
    };

    useEffect(() => { fetchIssues(); }, []);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const res = await api.get('/issues');
            setIssues(res.data.filter(i => i.status !== 'Resolved'));
        } catch (e) { 
            console.error('Error fetching issues:', e);
            alert('Failed to fetch issues. Check browser console.');
        }
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        setUpdating(prev => ({ ...prev, [id]: true }));
        try {
            await api.put(`/issues/${id}/status`, {
                status: newStatus,
                remarks: remarks[id] || ''
            });
            setSuccessId(id);
            setTimeout(() => setSuccessId(null), 2000);
            setRemarks(prev => { const n = { ...prev }; delete n[id]; return n; });
            fetchIssues();
        } catch (e) { alert('Failed to update status'); }
        finally { setUpdating(prev => ({ ...prev, [id]: false })); }
    };

    const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);
    const openCount = issues.filter(i => i.status === 'Open').length;
    const assignedCount = issues.filter(i => i.status === 'Assigned').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="text-orange-600 font-medium">{user?.name}</span></p>
                </div>
                <button onClick={fetchIssues} className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium">
                    ↻ Refresh
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Active', value: issues.length, color: 'text-gray-800', bg: 'bg-white' },
                        { label: 'Open', value: openCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Assigned', value: assignedCount, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-5 shadow-sm`}>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {['all', 'Open', 'Assigned'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition ${filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {f === 'all' ? 'All Issues' : f}
                        </button>
                    ))}
                </div>

                {/* Issues Grid */}
                {loading ? (
                    <div className="text-center py-16 text-gray-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                        <div className="text-5xl mb-3">✅</div>
                        <p className="text-gray-500 font-medium">No pending issues</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(issue => (
                            <div key={issue.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${successId === issue.id ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'}`}>
                                {issue.has_image && (
                                    <img src={getImageUrl(issue.id)} alt={issue.title} className="w-full h-40 object-cover" />
                                )}
                                <div className="p-4">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{issue.title}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{issue.category} · #{issue.id}</p>
                                        </div>
                                        <StatusBadge status={issue.status} />
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{issue.description}</p>

                                    {issue.is_escalated && (
                                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>
                                            <span className="text-xs font-bold text-red-600">ESCALATED BY CITIZEN</span>
                                        </div>
                                    )}

                                    {issue.remarks && (
                                        <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-xs text-gray-500 italic">
                                            Last: "{issue.remarks}"
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-3 border-t border-gray-50">
                                        <div>
                                            <label className="block text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Add Remarks</label>
                                            <textarea
                                                value={remarks[issue.id] || ''}
                                                onChange={e => setRemarks(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                                placeholder="Add notes..."
                                                rows={2}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Update Status</label>
                                            <div className="flex gap-2">
                                                {['Open', 'Assigned', 'Resolved'].map(s => (
                                                    <button key={s}
                                                        onClick={() => handleStatusUpdate(issue.id, s)}
                                                        disabled={updating[issue.id] || issue.status === s}
                                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${issue.status === s ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-gray-900 text-white hover:bg-gray-700'} disabled:opacity-50`}
                                                    >
                                                        {updating[issue.id] ? '...' : s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
