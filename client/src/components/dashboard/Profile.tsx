import { User, Edit3, Trash2, Save, X, Calendar, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { config } from "../../config/config";

export default function Profile() {
    const { user, setUser }: { user: any, setUser: any } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });

    const handleEdit = () => {
        setIsEditing(true);
        setFormData({
            name: user?.name || '',
            email: user?.email || ''
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: user?.name || '',
            email: user?.email || ''
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmail = emailRegex.test(formData.email);
        if (!validEmail) {
            setIsLoading(false);
            setError('Invalid email address');
            return;
        }

        try {
            const response = await fetch(`${config.apiUrl}/auth/profile/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Update user context or refresh data
                setIsEditing(false);
                setUser({
                    ...user,
                    name: formData.name,
                    email: formData.email
                });
                // You might want to update the user context here
            } else {
                console.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            setIsLoading(true);
            try {
                const response = await fetch(`${config.apiUrl}/auth/profile/delete`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    window.location.href = '/auth';
                } else {
                    console.error('Failed to delete account');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="flex-1 p-4 lg:p-6 z-30">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 mb-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="relative mb-6">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff&size=120`} 
                                alt="Profile Avatar" 
                                className="w-28 h-28 rounded-full ring-4 ring-white/20 shadow-lg"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-10 h-10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        
                        {!isEditing ? (
                            <>
                                <h1 className="text-3xl font-bold text-white mb-2">{user?.name}</h1>
                                <p className="text-blue-200 text-lg mb-1">{user?.email}</p>
                                <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                    {user?.role}
                                </span>
                            </>
                        ) : (
                            <div className="w-full max-w-md space-y-4">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Full Name"
                                />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Email Address"
                                />
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <Edit3 className="w-5 h-5" />
                                    <span>Edit Profile</span>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>Delete Account</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <X className="w-5 h-5" />
                                    <span>Cancel</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Timestamps Card */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                            <Calendar className="w-6 h-6" />
                            <span>Account Timeline</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Account Created</p>
                                    <p className="text-blue-200 text-sm">{formatDate(user?.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Last Updated</p>
                                    <p className="text-blue-200 text-sm">{formatDate(user?.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Stats */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                            <User className="w-6 h-6" />
                            <span>Account Details</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-blue-200">User ID</span>
                                <span className="text-white font-semibold">{user?.id || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-blue-200">Role</span>
                                <span className="text-white font-semibold">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}