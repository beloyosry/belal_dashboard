import { create } from "zustand";
import { persist } from "zustand/middleware";
import { endpoints } from "../config/axios";
import { toast } from "react-hot-toast";
import { useAuth } from "./auth";
import { TOKEN_KEY } from "../utils";

interface CVState {
    cvUrl: string | null;
    cvName: string | null;
    isUploading: boolean;
    error: string | null;
    uploadCV: (file: File) => Promise<string | null>;
    getCV: () => Promise<string | null>;
    checkCVStatus: () => Promise<boolean>;
    deleteCV: () => Promise<boolean>;
}

export const useCV = create<CVState>()(
    persist(
        (set, get) => ({
            cvUrl: null,
            cvName: null,
            isUploading: false,
            error: null,

            uploadCV: async (file: File) => {
                set({ isUploading: true, error: null });

                const token = useAuth.getState().token;

                if (!token) {
                    set({
                        error: "Authentication required. Please log in.",
                        isUploading: false,
                    });
                    toast.error("Authentication required");
                    return null;
                }

                try {
                    if (!token) {
                        throw new Error(
                            "Authentication required. Please log in."
                        );
                    }

                    const formData = new FormData();
                    formData.append("cv", file);

                    const response = await endpoints.cv.upload(formData);

                    if (response.status !== 200) {
                        throw new Error(
                            `Upload failed with status: ${response.status}`
                        );
                    }

                    const responseData = response.data;

                    if (!responseData.success) {
                        throw new Error(
                            "Upload failed: " +
                                (responseData.message || "Unknown error")
                        );
                    }

                    const statusResponse = await endpoints.cv.check();

                    if (
                        statusResponse.status === 200 &&
                        statusResponse.data.exists
                    ) {
                        const url = window.location.origin + "/api/cv";
                        const name = file.name;

                        set({
                            cvUrl: url,
                            cvName: name,
                            isUploading: false,
                        });

                        toast.success("CV uploaded successfully");
                        return url;
                    } else {
                        throw new Error(
                            "CV upload succeeded but file not found on server"
                        );
                    }
                } catch (error) {
                    set({
                        error: "Error uploading CV",
                        isUploading: false,
                    });
                    toast.error(
                        "Failed to upload CV: " +
                            (error instanceof Error
                                ? error.message
                                : "Unknown error")
                    );
                    return null;
                }
            },

            getCV: async () => {
                // Get token from auth store or localStorage
                const token =
                    useAuth.getState().token || localStorage.getItem(TOKEN_KEY);

                if (!token) {
                    // Silently fail for getCV - just return null without error toast
                    return null;
                }

                try {
                    // First check if CV exists
                    const statusResponse = await endpoints.cv.check();

                    if (
                        statusResponse.status !== 200 ||
                        !statusResponse.data?.exists
                    ) {
                        // CV doesn't exist
                        set({ cvUrl: null, cvName: null });
                        return null;
                    }

                    // CV exists, fetch it
                    const response = await endpoints.cv.get();

                    if (response.status === 200) {
                        let url;
                        let name = "cv.pdf";

                        // If the response is a binary file
                        if (response.data instanceof Blob) {
                            url = URL.createObjectURL(response.data);
                        } else if (
                            typeof response.data === "object" &&
                            response.data.url
                        ) {
                            // If the response contains a URL
                            url = response.data.url;
                            name = response.data.filename || name;
                        } else {
                            // Fallback: create a direct URL to the CV endpoint
                            url = window.location.origin + "/api/cv";
                        }

                        set({ cvUrl: url, cvName: name });
                        return url;
                    } else {
                        return null;
                    }
                } catch (error) {
                    set({ error: "Error fetching CV" });
                    return null;
                }
            },

            checkCVStatus: async () => {
                // Get token from auth store or localStorage
                const token =
                    useAuth.getState().token || localStorage.getItem(TOKEN_KEY);

                if (!token) {
                    return false;
                }

                try {
                    const response = await endpoints.cv.check();
                    return response.status === 200 && !!response.data;
                } catch (error) {
                    return false;
                }
            },

            deleteCV: async () => {
                // Get token from auth store or localStorage
                const token =
                    useAuth.getState().token || localStorage.getItem(TOKEN_KEY);

                if (!token) {
                    set({ error: "Authentication required. Please log in." });
                    toast.error("Authentication required");
                    return false;
                }

                try {
                    // Use axios endpoint for deletion
                    const response = await endpoints.cv.delete();

                    if (response.status === 200) {
                        // If we have a blob URL, revoke it to free memory
                        const currentUrl = get().cvUrl;
                        if (currentUrl && currentUrl.startsWith("blob:")) {
                            URL.revokeObjectURL(currentUrl);
                        }

                        set({ cvUrl: null, cvName: null });
                        toast.success("CV deleted successfully");
                        return true;
                    } else {
                        throw new Error(
                            `Failed to delete CV: ${response.status}`
                        );
                    }
                } catch (error) {
                    set({ error: "Error deleting CV" });
                    toast.error("Failed to delete CV");
                    return false;
                }
            },
        }),
        {
            name: "portfolio-cv",
        }
    )
);
