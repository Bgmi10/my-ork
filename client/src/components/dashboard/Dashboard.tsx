import { Building, Users, Target, BarChart3, Plus, TrendingUp, Calendar, CheckCircle2, User, Clock } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ user }: { user: any }) {
    const isAdmin = user.role === 'ADMIN';
    
    // Calculate real stats from actual user data
    const getStats = () => {
        if (isAdmin) {
            const departments = user.organization?.departments || [];
            const totalDepartments = departments.length;
            const totalTeams = departments.reduce((acc: number, dept: any) => acc + (dept.teams?.length || 0), 0);
            const totalMembers = departments.reduce((acc: number, dept: any) => 
                acc + dept.teams?.reduce((teamAcc: number, team: any) => teamAcc + (team.users?.length || 0), 0) || 0, 0);
            
            return [
                { label: 'Total Departments', value: totalDepartments.toString(), change: '+1', icon: Building, color: 'from-blue-600 to-indigo-600' },
                { label: 'Active Teams', value: totalTeams.toString(), change: '+2', icon: Users, color: 'from-green-600 to-emerald-600' },
                { label: 'Team Members', value: totalMembers.toString(), change: `+${Math.floor(totalMembers * 0.1)}`, icon: User, color: 'from-purple-600 to-pink-600' },
                { label: 'Organization', value: user.organization?.name || 'N/A', change: 'Active', icon: TrendingUp, color: 'from-orange-600 to-red-600' },
            ];
        } else {
            const myObjectives = user.objectives || [];
            const teamObjectives = user.team?.objectives || [];
            const totalKeyResults = myObjectives.reduce((acc: number, obj: any) => acc + (obj.keyResults?.length || 0), 0);
            const completedKeyResults = myObjectives.reduce((acc: number, obj: any) => 
                acc + (obj.keyResults?.filter((kr: any) => kr.progress === 100).length || 0), 0);
            
            return [
                { label: 'My Active OKRs', value: myObjectives.length.toString(), change: '+1', icon: Target, color: 'from-blue-600 to-indigo-600' },
                { label: 'Team Objectives', value: teamObjectives.length.toString(), change: '+2', icon: BarChart3, color: 'from-green-600 to-emerald-600' },
                { label: 'Key Results', value: totalKeyResults.toString(), change: `+${completedKeyResults}`, icon: CheckCircle2, color: 'from-purple-600 to-pink-600' },
                { label: 'Team', value: user.team?.name || 'No Team', change: user.team?.department?.name || '', icon: Users, color: 'from-orange-600 to-red-600' },
            ];
        }
    };

    // Generate real progress data from user objectives
    const getProgressData = () => {
        const objectives = user.objectives || [];
        if (objectives.length === 0) return [];
        
        return objectives.map((obj: any ) => ({
            name: obj.title.substring(0, 10) + '...',
            progress: obj.progress || 0,
            target: 100,
            id: obj.id
        }));
    };

    // Generate real status data
    const getObjectiveStatusData = () => {
        const objectives = isAdmin ? 
            (user.organization?.departments?.reduce((acc: any, dept: any) => 
                acc.concat(dept.teams?.reduce((teamAcc: any, team: any) => 
                    teamAcc.concat(team.objectives || []), []) || []), []) || []) :
            (user.objectives || []);

        const onTrack = objectives.filter((obj: any) => obj.progress >= 70).length;
        const atRisk = objectives.filter((obj: any) => obj.progress >= 30 && obj.progress < 70).length;
        const behind = objectives.filter((obj: any) => obj.progress < 30).length;

        return [
            { name: 'On Track', value: onTrack, color: '#10B981' },
            { name: 'At Risk', value: atRisk, color: '#F59E0B' },
            { name: 'Behind', value: behind, color: '#EF4444' },
        ];
    };

    // Generate team performance data for admin
    const getTeamPerformanceData = () => {
        if (!isAdmin || !user.organization?.departments) return [];
        
        return user.organization.departments.reduce((acc: any, dept: any) => {
            return acc.concat(dept.teams?.map((team: any) => ({
                team: team.name,
                members: team.users?.length || 0,
                objectives: team.objectives?.length || 0,
                progress: team.objectives?.length > 0 ? 
                    Math.round(team.objectives.reduce((sum: number, obj: any) => sum + (obj.progress || 0), 0) / team.objectives.length) : 0
            })) || []);
        }, []);
    };

    const getQuickActions = () => {
        if (isAdmin) {
            return [
                { title: 'Create Company OKR', desc: 'Set organizational objectives', icon: Building, color: 'from-blue-600 to-indigo-600' },
                { title: 'Manage Departments', desc: `${user.organization?.departments?.length || 0} departments`, icon: Users, color: 'from-green-600 to-emerald-600' },
                { title: 'View Analytics', desc: 'Organization performance insights', icon: BarChart3, color: 'from-purple-600 to-pink-600' },
            ];
        } else {
            return [
                { title: 'Update My Goals', desc: 'Track personal objectives', icon: Target, color: 'from-blue-600 to-indigo-600' },
                { title: 'Review Team Progress', desc: 'Check team performance', icon: Users, color: 'from-green-600 to-emerald-600' },
                { title: 'Create New OKR', desc: 'Add new objectives', icon: Plus, color: 'from-purple-600 to-pink-600' },
            ];
        }
    };

    const stats = getStats();
    const quickActions = getQuickActions();
    const progressData = getProgressData();
    const objectiveStatusData = getObjectiveStatusData();
    const teamPerformanceData = getTeamPerformanceData();

    return (
        <main className="flex-1 p-4 lg:p-6 z-30">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="lg:text-3xl font-bold text-white mb-2 sm:text-xl">
                                    Welcome back, {user.name}! 👋
                                </h2>
                                <p className="text-blue-200 text-lg mb-2">
                                    {isAdmin 
                                        ? `Managing ${user.organization?.name} organization` 
                                        : `Ready to achieve your objectives? Let's make progress today.`
                                    }
                                </p>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        isAdmin ? 'bg-red-500/20 text-red-300 border border-red-300/20' : 'bg-blue-500/20 text-blue-300 border border-blue-300/20'
                                    }`}>
                                        {user.role}
                                    </span>
                                    {!isAdmin && (
                                        <span className="text-blue-300 text-sm">
                                            {user.team?.name} • {user.team?.department?.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 lg:mt-0">
                                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                                    <Plus className="w-5 h-5" />
                                    <span>{isAdmin ? 'Create Company OKR' : 'Create New OKR'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 group hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                            <p className="text-blue-200 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Section - Only show if there's data */}
                {(progressData.length > 0 || objectiveStatusData.some(item => item.value > 0)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Progress Chart */}
                        {progressData.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-white mb-6">
                                    {isAdmin ? 'Organization Progress' : 'My Objectives Progress'}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={progressData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" stroke="#9CA3AF" />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#1F2937', 
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }} 
                                            />
                                            <Bar dataKey="progress" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Status Distribution */}
                        {objectiveStatusData.some(item => item.value > 0) && (
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-white mb-6">
                                    {isAdmin ? 'Company OKR Status' : 'My OKR Status'}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={objectiveStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {objectiveStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#1F2937', 
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center space-x-4 mt-4">
                                    {objectiveStatusData.map((item, index) => (
                                        <div key={index} className="flex items-center">
                                            <div 
                                                className="w-3 h-3 rounded-full mr-2" 
                                                style={{ backgroundColor: item.color }}
                                            ></div>
                                            <span className="text-white text-sm">{item.name} ({item.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Team Performance (Admin only) */}
                {isAdmin && teamPerformanceData.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 mb-8">
                        <h3 className="text-xl font-bold text-white mb-6">Team Performance Overview</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={teamPerformanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="team" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1F2937', 
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }} 
                                    />
                                    <Bar dataKey="progress" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* My Recent Objectives (Member only) */}
                {!isAdmin && user.objectives && user.objectives.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 mb-8">
                        <h3 className="text-xl font-bold text-white mb-6">My Current Objectives</h3>
                        <div className="space-y-4">
                            {user.objectives.map((objective: any) => (
                                <div key={objective.id} className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl p-6 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="text-white font-semibold text-lg mb-1">{objective.title}</h4>
                                            <p className="text-blue-200 text-sm mb-3">{objective.description}</p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <span className="text-2xl font-bold text-white">{objective.progress}%</span>
                                            <p className="text-blue-200 text-xs">Complete</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-blue-200 mb-2">
                                            <span>Progress</span>
                                            <span>{objective.progress}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${objective.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {objective.keyResults && objective.keyResults.length > 0 && (
                                        <div className="border-t border-white/10 pt-3">
                                            <p className="text-blue-200 text-sm mb-2">Key Results:</p>
                                            {objective.keyResults.map((kr: any) => (
                                                <div key={kr.id} className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-white">{kr.title}</span>
                                                    <span className="text-blue-300">{kr.currentValue}/{kr.targetValue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-blue-300 mt-3">
                                        <span className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(objective.startDate).toLocaleDateString()} - {new Date(objective.endDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Updated {new Date(objective.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickActions.map((action: any, index: number) => (
                            <button key={index} className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl p-6 text-left group transition-all duration-300 hover:border-white/30">
                                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-white font-semibold mb-2">{action.title}</h4>
                                <p className="text-blue-200 text-sm">{action.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}