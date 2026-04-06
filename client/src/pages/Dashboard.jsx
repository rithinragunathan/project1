import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CitizenDashboard from './dashboards/CitizenDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import AddUserModal from '../components/ui/AddUserModal';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Admin gets the full-screen sidebar layout from AdminDashboard
    if (user?.role === 'admin') {
        return (
            <div className="text-primary">
                {/* "Add User" button is inside AdminDashboard header for admin — 
                    but we expose it via a floating button or keep it in AdminDashboard's own header bar */}
                <AdminDashboard onAddUser={() => setShowAddUserModal(true)} />
                {showAddUserModal && (
                    <AddUserModal
                        onClose={() => setShowAddUserModal(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 text-primary">
            <header className="flex items-center justify-between px-6 py-4 mb-8 glass-card">
                <div>
                    <h1 className="text-2xl font-bold text-primary">EnviroReport</h1>
                    <p className="text-sm text-secondary">Welcome, {user?.name} ({user?.role})</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 font-semibold text-white transition bg-red-500 rounded-lg hover:bg-red-600 shadow-md"
                >
                    Logout
                </button>
            </header>

            <main>
                {user?.role === 'citizen' && <CitizenDashboard />}
                {user?.role === 'staff' && <StaffDashboard />}
            </main>
        </div>
    );
};

export default Dashboard;
