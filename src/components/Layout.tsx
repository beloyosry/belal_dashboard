import React from "react";
import { useNavigate } from "react-router-dom";
import { Code2, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <nav className="bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Code2 className="h-8 w-8 text-indigo-400" />
                                <span className="ml-2 text-xl font-bold text-white">
                                    Belal Dashboard
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleSignOut}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-800 hover:text-white focus:outline-none transition"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
