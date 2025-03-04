import React from "react";
import { AuthProvider } from "./AuthProvider";
import QueryProvider from "./QueryProvider";

// This component will compose all providers into a single wrapper
// You can add more providers here as your app grows
interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
    );
};

export default Providers;
