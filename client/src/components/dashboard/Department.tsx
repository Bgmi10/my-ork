import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { config } from "../../config/config";
import { 
    Building2, 
    Plus, 
    Edit3, 
    Trash2,
    CheckCircle,
    AlertCircle,
    Filter,
    Search,
    Save,
    X,
    Loader,
    Users,
    Target,
    ChevronDown,
    ChevronUp,
    Building,
    UserCheck
} from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Team {
    id: string;
    name: string;
    departmentId: string;
    users: User[];
}

interface Department {
    id: string;
    name: string;
    organizationId: string;
    teams: Team[];
}

interface Organization {
    id: string;
    name: string;
    departments: Department[];
}

export default function Department() {
    const { user }: { user: any } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isCreating, setIsCreating] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        teamIds: [] as string[]
    });

    // Get departments and teams from user organization data
    const organization = user?.organization as Organization;
    const departments = organization?.departments || [];
    
    // Get all teams from all departments for the team assignment dropdown
    const availableTeams = departments.flatMap(dept => dept.teams || []);

    // Calculate Department statistics
    const totalDepartments = departments.length;
    const totalTeams = departments.reduce((acc, dept) => acc + (dept.teams?.length || 0), 0);
    const averageTeamsPerDept = totalDepartments > 0 ? Math.round(totalTeams / totalDepartments) : 0;

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            teamIds: []
        });
        setIsCreating(false);
        setEditingDepartment(null);
        clearMessages();
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Department name is required');
            return false;
        }
        return true;
    };

    const toggleDepartmentExpansion = (deptId: string) => {
        setExpandedDepartments(prev => 
            prev.includes(deptId) 
                ? prev.filter(id => id !== deptId)
                : [...prev, deptId]
        );
    };

    const handleCreate = () => {
        setIsCreating(true);
        clearMessages();
    };

    const handleEdit = (department: Department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name,
            teamIds: department.teams?.map(team => team.id) || []
        });
        clearMessages();
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        clearMessages();

        try {
            const url = editingDepartment 
                ? `${config.apiUrl}/department/${editingDepartment.id}`
                : `${config.apiUrl}/department`;
            
            const method = editingDepartment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name.trim(),
                    teamIds: formData.teamIds,
                    organizationId: user?.organizationId || organization?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            if (editingDepartment) {
                setSuccess('Department updated successfully!');
            } else {
                setSuccess('Department created successfully!');
            }

            resetForm();
            // Note: The component will re-render with updated data when the user context is refreshed
        } catch (error: any) {
            console.error('Error saving department:', error);
            setError(error.message || 'Failed to save department. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (department: Department) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${department.name}"? This action cannot be undone.`
        );
        
        if (!confirmDelete) return;

        setIsLoading(true);
        clearMessages();

        try {
            const response = await fetch(`${config.apiUrl}/department/${department.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            setSuccess('Department deleted successfully!');
            // Note: The component will re-render with updated data when the user context is refreshed
        } catch (error: any) {
            console.error('Error deleting department:', error);
            setError(error.message || 'Failed to delete department. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDepartments = departments.filter((dept: Department) => {
        const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
        const teamCount = dept.teams?.length || 0;
        
        if (filterStatus === "all") return matchesSearch;
        if (filterStatus === "with_teams") return matchesSearch && teamCount > 0;
        if (filterStatus === "without_teams") return matchesSearch && teamCount === 0;
        
        return matchesSearch;
    });

    // Show loading state if user data is not available yet
    if (!user || !organization) {
        return (
            <main className="flex-1 p-4 lg:p-6 z-30">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-12 text-center">
                        <Loader className="w-16 h-16 text-blue-200 mx-auto mb-4 animate-spin" />
                        <h3 className="text-xl font-bold text-white mb-2">Loading Departments</h3>
                        <p className="text-blue-200">Please wait while we load your organization data...</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-4 lg:p-6 z-30">
            <div className="max-w-7xl mx-auto">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Success Display */}
                {success && (
                    <div className="bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl mb-6">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>{success}</span>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className="mb-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center space-x-3">
                                    <Building2 className="w-8 h-8" />
                                    <span>Department Management</span>
                                </h1>
                                <p className="text-blue-200 text-lg">
                                    Manage your organization's departments and team assignments
                                </p>
                            </div>
                            <div className="mt-4 lg:mt-0">
                                <button 
                                    onClick={handleCreate}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Create New Department</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Total Departments', value: totalDepartments.toString(), icon: Building2, color: 'from-blue-600 to-indigo-600' },
                        { label: 'Total Teams', value: totalTeams.toString(), icon: Users, color: 'from-purple-600 to-pink-600' },
                        { label: 'Avg Teams/Dept', value: averageTeamsPerDept.toString(), icon: Target, color: 'from-orange-600 to-red-600' },
                    ].map((stat, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 group hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                            <p className="text-blue-200 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search departments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="text-blue-200 w-5 h-5" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Departments</option>
                                <option value="with_teams">With Teams</option>
                                <option value="without_teams">Without Teams</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Create/Edit Form */}
                {(isCreating || editingDepartment) && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                                <Building className="w-6 h-6" />
                                <span>{editingDepartment ? 'Edit Department' : 'Create New Department'}</span>
                            </h3>
                            <button
                                onClick={resetForm}
                                className="text-blue-200 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter department name"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Assign Teams (Optional)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                    {availableTeams.map((team) => (
                                        <label key={team.id} className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.teamIds.includes(team.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            teamIds: [...formData.teamIds, team.id]
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            teamIds: formData.teamIds.filter(id => id !== team.id)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                                            />
                                            <div className="flex-1">
                                                <div className="text-white font-medium">{team.name}</div>
                                                <div className="text-blue-200 text-sm">
                                                    {team.users?.length || 0} users
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={resetForm}
                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>{editingDepartment ? 'Updating...' : 'Creating...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>{editingDepartment ? 'Update Department' : 'Create Department'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Departments List */}
                {filteredDepartments.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-12 text-center">
                        <Building2 className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            {departments.length === 0 ? "No Departments Yet" : "No Departments Found"}
                        </h3>
                        <p className="text-blue-200 mb-6">
                            {departments.length === 0 
                                ? "Create your first department to start organizing your teams." 
                                : "Try adjusting your search or filter criteria."
                            }
                        </p>
                        {departments.length === 0 && (
                            <button 
                                onClick={handleCreate}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Your First Department</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredDepartments.map((department: Department) => {
                            const isExpanded = expandedDepartments.includes(department.id);
                            const hasTeams = department.teams && department.teams.length > 0;
                            const teamCount = department.teams?.length || 0;
                            const totalUsers = department.teams?.reduce((acc, team) => acc + (team.users?.length || 0), 0) || 0;
                            
                            return (
                                <div key={department.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex-1 mb-4 lg:mb-0">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="text-xl font-bold text-white">{department.name}</h3>
                                                        <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                            {teamCount} Teams
                                                        </span>
                                                        {hasTeams && (
                                                            <button
                                                                onClick={() => toggleDepartmentExpansion(department.id)}
                                                                className="text-blue-200 hover:text-white transition-colors flex items-center space-x-1"
                                                            >
                                                                <span className="text-sm">View Teams</span>
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Department Stats */}
                                                    <div className="flex flex-wrap gap-4 text-sm">
                                                        <div className="flex items-center space-x-2 text-blue-200">
                                                            <Users className="w-4 h-4" />
                                                            <span>Teams: {teamCount}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-blue-200">
                                                            <UserCheck className="w-4 h-4" />
                                                            <span>Total Users: {totalUsers}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleEdit(department)}
                                                disabled={isLoading}
                                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(department)}
                                                disabled={isLoading}
                                                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white p-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Teams Section */}
                                    {hasTeams && isExpanded && (
                                        <div className="mt-6 pl-16 space-y-4">
                                            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                                                <Users className="w-5 h-5" />
                                                <span>Assigned Teams</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {department.teams.map((team: Team) => (
                                                    <div key={team.id} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                                                        <div className="flex items-center space-x-3 mb-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Users className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h5 className="font-semibold text-white">{team.name}</h5>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-sm text-blue-200">
                                                            <div className="flex justify-between">
                                                                <span>Users:</span>
                                                                <span className="font-semibold text-white">{team.users?.length || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}