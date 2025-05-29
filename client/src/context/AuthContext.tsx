import { createContext, useContext, useEffect, useState } from "react";
import { config } from "../config/config";

export const AuthContext = createContext({
    user: null,
    setUser: (_user: any) => {},
    isAuthenticated: false,
    setIsAuthenticated: (_isAuthenticated: boolean) => {},
    handleLogout: () => {},
});


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchProfile = async () => {
        const response = await fetch(`${config.apiUrl}/auth/profile`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
        });
        const data = await response.json();
        if (response.status === 200) {
            setUser(data.data);
            setIsAuthenticated(true);
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    }

    useEffect(() => {
        fetchProfile();
    }, [])

    const handleLogout = async () => {
        const response = await fetch(`${config.apiUrl}/auth/logout`, {
            method: "POST",
            credentials: 'include',
        });
        if (response.status === 200) {
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = "/auth";
        }
    }

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, setIsAuthenticated, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
   return useContext(AuthContext);
}

