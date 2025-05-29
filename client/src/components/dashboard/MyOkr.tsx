import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { config } from "../../config/config";
import { 
    Target, 
    Plus, 
    Calendar, 
    Clock, 
    Edit3, 
    Trash2, 
    TrendingUp,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Filter,
    Search,
    Save,
    Loader,
    ChevronDown,
    ChevronUp,
    Award,
} from "lucide-react";

export default function MyOkr({ setActiveSection }: { setActiveSection: (section: string) => void }) {
    const { user, setUser }: { user: any, setUser: any } = useAuth();
    const [okrs, setOkrs] = useState(user?.objectives || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [editingOkr, setEditingOkr] = useState<any>(null);
    const [editingKeyResult, setEditingKeyResult] = useState<any>(null);
    const [expandedOkrs, setExpandedOkrs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        progress: 0
    });
    const [keyResultFormData, setKeyResultFormData] = useState({
        title: '',
        targetValue: 0,
        currentValue: 0,
        status: 'NOT_STARTED'
    });

    // Calculate OKR statistics
    const totalOkrs = okrs.length;
    const completedOkrs = okrs.filter((okr: any) => okr.progress === 100).length;
    const overallProgress = totalOkrs > 0 ? Math.round(okrs.reduce((acc: number, okr: any) => acc + okr.progress, 0) / totalOkrs) : 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateForInput = (dateString: string) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    const getStatusColor = (okr: any) => {
        const now = new Date();
        const endDate = new Date(okr.endDate);
        
        if (okr.progress === 100) return 'from-green-600 to-emerald-600';
        if (now > endDate) return 'from-red-600 to-pink-600';
        if (okr.progress >= 75) return 'from-blue-600 to-indigo-600';
        if (okr.progress >= 50) return 'from-yellow-600 to-orange-600';
        return 'from-gray-600 to-slate-600';
    };

    const getStatusIcon = (okr: any) => {
        const now = new Date();
        const endDate = new Date(okr.endDate);
        
        if (okr.progress === 100) return CheckCircle;
        if (now > endDate) return AlertCircle;
        return TrendingUp;
    };

    const getStatusText = (okr: any) => {
        const now = new Date();
        const endDate = new Date(okr.endDate);
        
        if (okr.progress === 100) return 'Completed';
        if (now > endDate) return 'Overdue';
        return 'In Progress';
    };

    const getKeyResultStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'from-green-600 to-emerald-600';
            case 'IN_PROGRESS': return 'from-blue-600 to-indigo-600';
            case 'AT_RISK': return 'from-yellow-600 to-orange-600';
            case 'NOT_STARTED': return 'from-gray-600 to-slate-600';
            default: return 'from-gray-600 to-slate-600';
        }
    };

    const getKeyResultStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return CheckCircle;
            case 'IN_PROGRESS': return TrendingUp;
            case 'AT_RISK': return AlertCircle;
            case 'NOT_STARTED': return Clock;
            default: return Clock;
        }
    };

    const toggleOkrExpansion = (okrId: string) => {
        setExpandedOkrs(prev => 
            prev.includes(okrId) 
                ? prev.filter(id => id !== okrId)
                : [...prev, okrId]
        );
    };

    const handleEdit = (okr: any) => {
        setEditingOkr(okr);
        setEditFormData({
            title: okr.title,
            description: okr.description,
            startDate: formatDateForInput(okr.startDate),
            endDate: formatDateForInput(okr.endDate),
            progress: okr.progress
        });
        setError('');
        setSuccess('');
    };

    const handleEditKeyResult = (keyResult: any) => {
        setEditingKeyResult(keyResult);
        setKeyResultFormData({
            title: keyResult.title,
            targetValue: keyResult.targetValue,
            currentValue: keyResult.currentValue,
            status: keyResult.status
        });
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setEditingOkr(null);
        setEditFormData({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            progress: 0
        });
        setError('');
    };

    const handleCancelKeyResultEdit = () => {
        setEditingKeyResult(null);
        setKeyResultFormData({
            title: '',
            targetValue: 0,
            currentValue: 0,
            status: 'NOT_STARTED'
        });
        setError('');
    };

    const validateEditForm = () => {
        if (!editFormData.title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!editFormData.description.trim()) {
            setError('Description is required');
            return false;
        }
        if (!editFormData.startDate) {
            setError('Start date is required');
            return false;
        }
        if (!editFormData.endDate) {
            setError('End date is required');
            return false;
        }
        if (new Date(editFormData.startDate) >= new Date(editFormData.endDate)) {
            setError('End date must be after start date');
            return false;
        }
        if (editFormData.progress < 0 || editFormData.progress > 100) {
            setError('Progress must be between 0 and 100');
            return false;
        }
        return true;
    };

    const validateKeyResultForm = () => {
        if (!keyResultFormData.title.trim()) {
            setError('Key Result title is required');
            return false;
        }
        if (keyResultFormData.targetValue <= 0) {
            setError('Target value must be greater than 0');
            return false;
        }
        if (keyResultFormData.currentValue < 0) {
            setError('Current value cannot be negative');
            return false;
        }
        if (keyResultFormData.currentValue > keyResultFormData.targetValue) {
            setError('Current value cannot exceed target value');
            return false;
        }
        return true;
    };

    const handleSaveEdit = async () => {
        if (!validateEditForm()) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.apiUrl}/okrs/${editingOkr.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: editFormData.title.trim(),
                    description: editFormData.description.trim(),
                    startDate: new Date(editFormData.startDate).toISOString(),
                    endDate: new Date(editFormData.endDate).toISOString(),
                    progress: Number(editFormData.progress)
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const updatedOkr = data.data;

            // Update local state
            const updatedOkrs = okrs.map((okr: any) => 
                okr.id === editingOkr.id ? updatedOkr : okr
            );
            setOkrs(updatedOkrs);

            // Update user context
            setUser({
                ...user,
                objectives: updatedOkrs
            });

            setSuccess('OKR updated successfully!');
            handleCancelEdit();
        } catch (error: any) {
            console.error('Error updating OKR:', error);
            setError(error.message || 'Failed to update OKR. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveKeyResult = async () => {
        if (!validateKeyResultForm()) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.apiUrl}/okrs/key-result/${editingKeyResult.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: keyResultFormData.title.trim(),
                    targetValue: Number(keyResultFormData.targetValue),
                    currentValue: Number(keyResultFormData.currentValue),
                    status: keyResultFormData.status
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const updatedKeyResult = data.data;

            // Update local state - find the OKR and update its key result
            const updatedOkrs = okrs.map((okr: any) => {
                if (okr.keyResults && okr.keyResults.some((kr: any) => kr.id === editingKeyResult.id)) {
                    return {
                        ...okr,
                        keyResults: okr.keyResults.map((kr: any) => 
                            kr.id === editingKeyResult.id ? updatedKeyResult : kr
                        )
                    };
                }
                return okr;
            });

            setOkrs(updatedOkrs);

            // Update user context
            setUser({
                ...user,
                objectives: updatedOkrs
            });

            setSuccess('Key Result updated successfully!');
            handleCancelKeyResultEdit();
        } catch (error: any) {
            console.error('Error updating Key Result:', error);
            setError(error.message || 'Failed to update Key Result. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (okr: any) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${okr.title}"? This action cannot be undone.`
        );
        
        if (!confirmDelete) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.apiUrl}/okrs/${okr.id}`, {
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

            // Update local state
            const updatedOkrs = okrs.filter((o: any) => o.id !== okr.id);
            setOkrs(updatedOkrs);

            // Update user context
            setUser({
                ...user,
                objectives: updatedOkrs
            });

            setSuccess('OKR deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting OKR:', error);
            setError(error.message || 'Failed to delete OKR. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteKeyResult = async (keyResult: any) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${keyResult.title}"? This action cannot be undone.`
        );
        
        if (!confirmDelete) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.apiUrl}/okrs/key-result/${keyResult.id}`, {
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

            // Update local state - remove the key result from its parent OKR
            const updatedOkrs = okrs.map((okr: any) => {
                if (okr.keyResults && okr.keyResults.some((kr: any) => kr.id === keyResult.id)) {
                    return {
                        ...okr,
                        keyResults: okr.keyResults.filter((kr: any) => kr.id !== keyResult.id)
                    };
                }
                return okr;
            });

            setOkrs(updatedOkrs);

            // Update user context
            setUser({
                ...user,
                objectives: updatedOkrs
            });

            setSuccess('Key Result deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting Key Result:', error);
            setError(error.message || 'Failed to delete Key Result. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredOkrs = okrs.filter((okr: any) => {
        const matchesSearch = okr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            okr.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterStatus === "all") return matchesSearch;
        if (filterStatus === "completed") return matchesSearch && okr.progress === 100;
        if (filterStatus === "active") {
            const now = new Date();
            const startDate = new Date(okr.startDate);
            const endDate = new Date(okr.endDate);
            return matchesSearch && now >= startDate && now <= endDate && okr.progress < 100;
        }
        if (filterStatus === "overdue") {
            const now = new Date();
            const endDate = new Date(okr.endDate);
            return matchesSearch && now > endDate && okr.progress < 100;
        }
        
        return matchesSearch;
    });

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
                                    <Target className="w-8 h-8" />
                                    <span>My OKRs</span>
                                </h1>
                                <p className="text-blue-200 text-lg">
                                    Track your objectives and key results progress
                                </p>
                            </div>
                            <div className="mt-4 lg:mt-0">
                                <button 
                                    onClick={() => setActiveSection("create-okr")}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Create New OKR</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total OKRs', value: totalOkrs.toString(), icon: Target, color: 'from-blue-600 to-indigo-600' },
                        { label: 'Completed', value: completedOkrs.toString(), icon: CheckCircle, color: 'from-purple-600 to-pink-600' },
                        { label: 'Overall Progress', value: `${overallProgress}%`, icon: BarChart3, color: 'from-orange-600 to-red-600' },
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
                                placeholder="Search OKRs..."
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
                                <option value="all">All OKRs</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* OKRs List */}
                {filteredOkrs.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-12 text-center">
                        <Target className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            {okrs.length === 0 ? "No OKRs Yet" : "No OKRs Found"}
                        </h3>
                        <p className="text-blue-200 mb-6">
                            {okrs.length === 0 
                                ? "Create your first OKR to start tracking your objectives and key results." 
                                : "Try adjusting your search or filter criteria."
                            }
                        </p>
                        {okrs.length === 0 && (
                            <button 
                                onClick={() => setActiveSection("create-okr")}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Your First OKR</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOkrs.map((okr: any) => {
                            const StatusIcon = getStatusIcon(okr);
                            const isExpanded = expandedOkrs.includes(okr.id);
                            const hasKeyResults = okr.keyResults && okr.keyResults.length > 0;
                            
                            return (
                                <div key={okr.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                                    {editingOkr?.id === okr.id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-200 mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        value={editFormData.title}
                                                        onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-200 mb-1">Progress</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={editFormData.progress}
                                                        onChange={(e) => setEditFormData({...editFormData, progress: Number(e.target.value)})}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-1">Description</label>
                                                <textarea
                                                    value={editFormData.description}
                                                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-200 mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={editFormData.startDate}
                                                        onChange={(e) => setEditFormData({...editFormData, startDate: e.target.value})}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-200 mb-1">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={editFormData.endDate}
                                                        onChange={(e) => setEditFormData({...editFormData, endDate: e.target.value})}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-300"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    disabled={isLoading}
                                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader className="w-4 h-4 animate-spin" />
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            <span>Save Changes</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex-1 mb-4 lg:mb-0">
                                                    <div className="flex items-start space-x-4">
                                                        <div className={`w-12 h-12 bg-gradient-to-br ${getStatusColor(okr)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                            <StatusIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <h3 className="text-xl font-bold text-white">{okr.title}</h3>
                                                                <span className={`inline-block bg-gradient-to-r ${getStatusColor(okr)} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                                                                    {getStatusText(okr)}
                                                                </span>
                                                                {hasKeyResults && (
                                                                    <button
                                                                        onClick={() => toggleOkrExpansion(okr.id)}
                                                                        className="text-blue-200 hover:text-white transition-colors flex items-center space-x-1"
                                                                    >
                                                                        <span className="text-sm">Key Results ({okr.keyResults.length})</span>
                                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-blue-200 mb-4">{okr.description}</p>
                                                            
                                                            {/* Progress Bar */}
                                                            <div className="mb-4">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-sm text-blue-200">Progress</span>
                                                                    <span className="text-sm font-semibold text-white">{okr.progress}%</span>
                                                                </div>
                                                                <div className="w-full bg-white/20 rounded-full h-2">
                                                                    <div 
                                                                        className={`h-2 bg-gradient-to-r ${getStatusColor(okr)} rounded-full transition-all duration-300`}
                                                                        style={{ width: `${okr.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>

                                                            {/* Dates */}
                                                            <div className="flex flex-wrap gap-4 text-sm">
                                                                <div className="flex items-center space-x-2 text-blue-200">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>Start: {formatDate(okr.startDate)}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2 text-blue-200">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>End: {formatDate(okr.endDate)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => handleEdit(okr)}
                                                        disabled={isLoading}
                                                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(okr)}
                                                        disabled={isLoading}
                                                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white p-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Key Results Section */}
                                            {hasKeyResults && isExpanded && (
                                                <div className="mt-6 pl-16 space-y-4">
                                                    <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                                                        <Award className="w-5 h-5" />
                                                        <span>Key Results</span>
                                                    </h4>
                                                    {okr.keyResults.map((keyResult: any) => {
                                                        const KeyResultIcon = getKeyResultStatusIcon(keyResult.status);
                                                        const progress = keyResult.targetValue > 0 ? Math.min(100, (keyResult.currentValue / keyResult.targetValue) * 100) : 0;
                                                        
                                                        return (
                                                            <div key={keyResult.id} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                                                                {editingKeyResult?.id === keyResult.id ? (
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-blue-200 mb-1">Title</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={keyResultFormData.title}
                                                                                    onChange={(e) => setKeyResultFormData({...keyResultFormData, title: e.target.value})}
                                                                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-blue-200 mb-1">Status</label>
                                                                                <select
                                                                                    value={keyResultFormData.status}
                                                                                    onChange={(e) => setKeyResultFormData({...keyResultFormData, status: e.target.value})}
                                                                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                >
                                                                                    <option value="NOT_STARTED">Not Started</option>
                                                                                    <option value="IN_PROGRESS">In Progress</option>
                                                                                    <option value="AT_RISK">At Risk</option>
                                                                                    <option value="COMPLETED">Completed</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-blue-200 mb-1">Current Value</label>
                                                                                <input
                                                                                    type="number"
                                                                                    value={keyResultFormData.currentValue}
                                                                                    onChange={(e) => setKeyResultFormData({...keyResultFormData, currentValue: Number(e.target.value)})}
                                                                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-blue-200 mb-1">Target Value</label>
                                                                                <input
                                                                                    type="number"
                                                                                    value={keyResultFormData.targetValue}
                                                                                    onChange={(e) => setKeyResultFormData({...keyResultFormData, targetValue: Number(e.target.value)})}
                                                                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-end space-x-3">
                                                                            <button
                                                                                onClick={handleCancelKeyResultEdit}
                                                                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-300"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                onClick={handleSaveKeyResult}
                                                                                disabled={isLoading}
                                                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                                                            >
                                                                                {isLoading ? (
                                                                                    <>
                                                                                        <Loader className="w-4 h-4 animate-spin" />
                                                                                        <span>Saving...</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Save className="w-4 h-4" />
                                                                                        <span>Save Changes</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center space-x-3 flex-1">
                                                                                <div className={`w-8 h-8 bg-gradient-to-br ${getKeyResultStatusColor(keyResult.status)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                                                    <KeyResultIcon className="w-4 h-4 text-white" />
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                                        <h5 className="font-semibold text-white">{keyResult.title}</h5>
                                                                                        <span className={`inline-block bg-gradient-to-r ${getKeyResultStatusColor(keyResult.status)} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                                                                                            {keyResult.status.replace('_', ' ')}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center space-x-4 text-sm text-blue-200">
                                                                                        <span>Progress: {keyResult.currentValue} / {keyResult.targetValue}</span>
                                                                                        <span>{Math.round(progress)}%</span>
                                                                                    </div>
                                                                                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                                                                        <div 
                                                                                            className={`h-1.5 bg-gradient-to-r ${getKeyResultStatusColor(keyResult.status)} rounded-full`}
                                                                                            style={{ width: `${progress}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex space-x-2">
                                                                                <button 
                                                                                    onClick={() => handleEditKeyResult(keyResult)}
                                                                                    disabled={isLoading}
                                                                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                >
                                                                                    <Edit3 className="w-4 h-4" />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleDeleteKeyResult(keyResult)}
                                                                                    disabled={isLoading}
                                                                                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white p-2 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
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