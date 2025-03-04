import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Providers from "./providers/Providers";
import { useAuth } from "./providers/AuthProvider";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { session } = useAuth();
    if (!session) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <Providers>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Providers>
            <Toaster position="top-right" />
        </BrowserRouter>
    );
}

export default App;
