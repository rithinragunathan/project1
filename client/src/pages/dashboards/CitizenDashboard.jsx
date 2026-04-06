import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MapPicker from '../../components/ui/MapPicker';

const CATEGORIES = ['Waste', 'Pollution', 'Sanitation', 'Water', 'Air Quality', 'Other'];

const StatusBadge = ({ status }) => {
    const colors = {
        Open: 'bg-emerald-100 text-emerald-700',
        Assigned: 'bg-amber-100 text-amber-700',
        Resolved: 'bg-blue-100 text-blue-700',
        Verified: 'bg-purple-100 text-purple-700',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

const CitizenDashboard = () => {
    const { api, user } = useAuth();
    const [issues, setIssues] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [formData, setFormData] = useState({
        title: '', description: '', category: 'Waste', latitude: '', longitude: '', image: null
    });

    // Get image URL from API endpoint
    const getImageUrl = (issueId) => {
        if (!issueId) return '';
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        return `${baseUrl}/issues/${issueId}/image`;
    };

    useEffect(() => { fetchIssues(); }, []);

    const fetchIssues = async () => {
        try {
            const res = await api.get('/issues');
            setIssues(res.data);
        } catch (e) { 
            console.error('Error fetching issues:', e);
            alert('Failed to fetch issues. Check browser console.');
        }
    };

    const handleEscalate = async (issueId) => {
        if (!window.confirm('Are you sure you want to escalate this issue? This marks it as unresolved for admin review.')) return;
        try {
            await api.post(`/issues/${issueId}/escalate`);
            setIssues(prev => prev.map(i => i.id === issueId ? { ...i, is_escalated: 1 } : i));
            setSuccessMsg('Issue escalated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error('Escalation error:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to escalate. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) {
            alert('Please select a location on the map or use your current location.');
            return;
        }
        setIsSubmitting(true);
        const data = new FormData();
        // Append all form fields explicitly to ensure proper handling
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('latitude', parseFloat(formData.latitude));
        data.append('longitude', parseFloat(formData.longitude));
        if (formData.image) data.append('image', formData.image);

        try {
            await api.post('/issues', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowForm(false);
            setFormData({ title: '', description: '', category: 'Waste', latitude: '', longitude: '', image: null });
            fetchIssues();
            setSuccessMsg('Issue reported successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter to show only current user's issues (\"My Reports\")
    const myIssues = issues.filter(i => i.user_id === user?.id);
    const open = myIssues.filter(i => i.status === 'Open').length;
    const resolved = myIssues.filter(i => i.status === 'Resolved').length;
    const escalated = myIssues.filter(i => i.is_escalated).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="text-blue-600 font-medium">{user?.name}</span></p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${showForm ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-lg'}`}
                >
                    {showForm ? '✕ Cancel' : '+ Report Issue'}
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Success Banner */}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 font-medium text-sm">
                        <span>✓</span> {successMsg}
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Reported', value: myIssues.length, color: 'text-gray-800', bg: 'bg-white', border: 'border-gray-100' },
                        { label: 'Open Issues', value: open, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                        { label: 'Escalated', value: escalated, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 shadow-sm`}>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Report Form */}
                {showForm && (
                    <div className="bg-white border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
                            <h2 className="text-white font-bold text-lg">Report a New Issue</h2>
                            <p className="text-blue-100 text-sm mt-0.5">Help us improve your community</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text" name="title" value={formData.title} required
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Illegal dumping near park"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                        <select name="category" value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                                        <textarea name="description" value={formData.description} required rows={4}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the issue in detail..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Evidence Photo</label>
                                        <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition group">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400 group-hover:text-blue-500">{formData.image ? `✓ ${formData.image.name}` : '📷 Click to upload photo'}</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2 mb-3">
                                        <button type="button"
                                            onClick={() => navigator.geolocation?.getCurrentPosition(
                                                pos => setFormData({ ...formData, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                                                () => alert('Could not detect location')
                                            )}
                                            className="flex-1 py-2 text-sm bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition font-medium"
                                        >
                                            📍 Use My Location
                                        </button>
                                        {formData.latitude && (
                                            <button type="button" onClick={() => setFormData({ ...formData, latitude: '', longitude: '' })}
                                                className="px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition text-gray-600"
                                            >Clear</button>
                                        )}
                                    </div>
                                    {formData.latitude ? (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                                            <p className="text-emerald-700 font-semibold">✓ Location set</p>
                                            <p className="text-emerald-600 font-mono text-xs mt-0.5">{parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}</p>
                                        </div>
                                    ) : (
                                        <MapPicker onLocationSelect={loc => setFormData({ ...formData, latitude: loc.lat, longitude: loc.lng })} />
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                                <button type="submit" disabled={isSubmitting}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 shadow-sm shadow-blue-200"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Issues List */}
                <div>
                    <h2 className="font-bold text-gray-800 mb-4 text-lg">My Reports ({myIssues.length})</h2>
                    {myIssues.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                            <div className="text-5xl mb-3">📋</div>
                            <p className="text-gray-500 font-medium">No issues reported yet</p>
                            <p className="text-gray-400 text-sm mt-1">Click "Report Issue" to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myIssues.map(issue => (
                                <div key={issue.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${issue.is_escalated ? 'border-red-200' : 'border-gray-100'}`}>
                                    {issue.has_image && (
                                        <img src={getImageUrl(issue.id)} alt={issue.title} className="w-full h-36 object-cover" />
                                    )}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 className="font-bold text-gray-900 text-sm leading-snug flex-1">{issue.title}</h3>
                                            <StatusBadge status={issue.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{issue.description}</p>

                                        {issue.remarks && (
                                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-3">
                                                <p className="text-xs text-amber-700"><strong>Staff Note:</strong> {issue.remarks}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
                                            <span>{issue.category}</span>
                                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {issue.is_escalated ? (
                                            <div className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl text-center">
                                                🔴 Escalated — Under Admin Review
                                            </div>
                                        ) : issue.status === 'Resolved' ? (
                                            <button
                                                onClick={() => handleEscalate(issue.id)}
                                                className="w-full py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition"
                                            >
                                                Not Satisfied? Escalate →
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CitizenDashboard;
