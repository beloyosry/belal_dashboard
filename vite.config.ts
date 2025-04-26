import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env variables
    const env = loadEnv(mode, ".");

    // Check if we should use local API (can be set via .env file or command line)
    const useLocalApi = env.VITE_USE_LOCAL_API === "true";

    // API target based on environment
    const apiTarget = useLocalApi
        ? "http://localhost:3000"
        : "https://myportfoliobackend-production-9f43.up.railway.app/";

    console.log(`API target: ${apiTarget} (useLocalApi: ${useLocalApi})`);
    return {
        plugins: [react(), mode === "development" && componentTagger()].filter(
            Boolean
        ),
        server: {
            proxy: {
                "/api": {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
