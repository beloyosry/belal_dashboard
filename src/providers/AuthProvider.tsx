import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";

// Define the context type
interface AuthContextType {
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
    session: null,
    loading: true,
    signIn: async () => {},
    signOut: async () => {},
});

// Auth Provider Component
export function AuthProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const allowedRoutes = ["/login"];

    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;

    useEffect(() => {
        const fetchSession = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData.session;
            setSession(session);

            if (session) {
                if (allowedRoutes.includes(pathname)) {
                    navigate("/");
                }
            } else if (!allowedRoutes.includes(pathname)) {
                navigate("/login");
            }

            setLoading(false);
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, [pathname, navigate]);

    const signIn = async (email: string, password: string) => {
        if (!supabase) throw new Error("Supabase not configured");
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signOut = async () => {
        if (!supabase) throw new Error("Supabase not configured");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);
