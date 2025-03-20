import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

const BUCKET_NAME = "cv-storage";
const FILE_PATH = "admin/assets/";
const CV_FILE_NAME = FILE_PATH + "Belal_Yosry_FrontEnd_CV.pdf";

export const uploadCV = async (file: File): Promise<string | null> => {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(CV_FILE_NAME, file, { cacheControl: "3600", upsert: true });

        if (error) {
            handleSupabaseError("Upload failed", error);
            return null;
        }

        toast.success("CV uploaded successfully!");
        return getCVUrl();
    } catch (error) {
        console.error("CV upload error:", error);
        toast.error("An unexpected error occurred while uploading your CV");
        return null;
    }
};

export const getCVUrl = (): string => {
    return supabase.storage.from(BUCKET_NAME).getPublicUrl(CV_FILE_NAME).data
        .publicUrl;
};

export const downloadCV = async (): Promise<void> => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(CV_FILE_NAME);

        if (error) {
            handleSupabaseError("Download failed", error);
            return;
        }

        // Create a blob URL and trigger the download
        const url = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Belal_Yosry_FrontEnd_CV.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error("CV download error:", error);
        toast.error("An unexpected error occurred while downloading your CV");
    }
};

const handleSupabaseError = (action: string, error: any) => {
    console.error(`${action}:`, error.message);
    const errorMsg = error.message.includes("security policy")
        ? `${action}: You don't have permission. Please make sure you're logged in with the correct account.`
        : `${action}: ${error.message}`;
    toast.error(errorMsg);
};
