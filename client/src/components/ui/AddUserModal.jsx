import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
        {children}
    </div>
);

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm";

const AddUserModal = ({ onClose, onUserAdded }) => {
    const { api } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'staff' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/create-user', formData);
            setSuccess(true);
            if (onUserAdded) onUserAdded();
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            console.error('Create user error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to create user. Check server logs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">Add New User</h2>
                        <p className="text-green-100 text-xs mt-0.5">Create a staff, admin, or citizen account</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg transition">✕</button>
                </div>

                {success ? (
                    <div className="px-6 py-12 text-center">
                        <div className="text-5xl mb-3">✅</div>
                        <p className="font-bold text-gray-800">User Created!</p>
                        <p className="text-sm text-gray-500 mt-1">Closing automatically...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <Field label="Full Name">
                            <input type="text" name="name" value={formData.name} onChange={handleChange}
                                className={inputClass} placeholder="John Smith" required />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Email">
                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                    className={inputClass} placeholder="john@example.com" required />
                            </Field>
                            <Field label="Phone">
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    className={inputClass} placeholder="+91 9999999999" required />
                            </Field>
                        </div>

                        <Field label="Password">
                            <input type="password" name="password" value={formData.password} onChange={handleChange}
                                className={inputClass} placeholder="Min 8 characters" required minLength={8} />
                        </Field>

                        <Field label="Role">
                            <div className="grid grid-cols-3 gap-2">
                                {['citizen', 'staff', 'admin'].map(r => (
                                    <button type="button" key={r} onClick={() => setFormData({ ...formData, role: r })}
                                        className={`py-2.5 rounded-xl text-sm font-semibold capitalize border transition ${formData.role === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                            >Cancel</button>
                            <button type="submit" disabled={loading}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition disabled:opacity-60 shadow-sm"
                            >
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddUserModal;
