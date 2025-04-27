import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useCV } from "../lib/cv";
import * as LucideIcons from "lucide-react";
import { toast } from "react-hot-toast";

const icons = {
    ...LucideIcons,
};

const CVEditor: React.FC = () => {
    const { cvUrl, cvName, isUploading, getCV, uploadCV, deleteCV } = useCV();
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        getCV();
    }, [getCV]);

    const handleDeleteClick = async () => {
        if (confirmDelete) {
            const success = await deleteCV();
            if (success) {
                setConfirmDelete(false);
            }
        } else {
            setConfirmDelete(true);
            // Auto-reset after 3 seconds
            setTimeout(() => setConfirmDelete(false), 3000);
        }
    };

    const handleDownload = () => {
        if (!cvUrl) return;

        // For blob URLs, we can download directly
        if (cvUrl.startsWith("blob:")) {
            const link = document.createElement("a");
            link.href = cvUrl;
            link.download = cvName || "cv.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download started");
            return;
        }

        // For API URLs, we need to fetch with proper credentials
        toast.loading("Preparing download...", { id: "cv-download" });

        fetch("/api/cv", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem(
                    "portfolio-auth-token"
                )}`,
            },
        })
            .then((response) => response.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = cvName || "cv.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url); // Clean up
                toast.dismiss("cv-download");
                toast.success("Download started");
            })
            .catch((error) => {
                toast.dismiss("cv-download");
                toast.error("Download failed",error);
            });
    };

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];

        toast.loading("Uploading CV...", { id: "cv-upload" });
        await uploadCV(file)
            .then((url) => {
                if (url) {
                    toast.dismiss("cv-upload");
                    toast.success("CV uploaded successfully");
                }
            })
            .catch((error) => {
                toast.dismiss("cv-upload");
                toast.error("Failed to upload CV",error);
            })
            .finally(() => {
                getCV();
            });
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
    });

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
                CV Management
            </h2>

            {cvUrl ? (
                <div className="flex flex-col items-center mb-6">
                    {/* PDF Preview */}
                    <div className="w-full max-w-md mb-4 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="p-4 bg-indigo-600 flex items-center justify-between">
                            <div className="flex items-center">
                                <icons.FileText className="h-6 w-6 text-white mr-2" />
                                <p className="text-lg font-medium text-white truncate max-w-[200px]">
                                    {cvName || "Your CV"}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => window.open(cvUrl, "_blank")}
                                    className="p-1.5 bg-indigo-500 rounded-full hover:bg-indigo-400 transition"
                                    title="View CV"
                                >
                                    <icons.ExternalLink className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex justify-center">
                            <div className="w-24 h-32 bg-gray-800 border border-gray-600 rounded flex items-center justify-center">
                                <icons.FileText className="h-12 w-12 text-indigo-400" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition flex items-center"
                        >
                            <icons.Download className="h-4 w-4 mr-2" />
                            Download CV
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className={`px-4 py-2 ${
                                confirmDelete ? "bg-red-700" : "bg-red-600"
                            } text-white rounded-md hover:bg-red-500 transition flex items-center`}
                        >
                            <icons.Trash2 className="h-4 w-4 mr-2" />
                            {confirmDelete ? "Confirm Delete" : "Delete CV"}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-gray-400 mb-4 text-center">
                    No CV uploaded yet. Upload your CV to make it available on
                    your portfolio.
                </p>
            )}

            <div
                {...getRootProps()}
                className="mt-4 p-6 border-2 border-dashed border-indigo-500 rounded-lg text-center cursor-pointer hover:bg-gray-700 transition-colors"
            >
                <input {...getInputProps()} />
                {isUploading ? (
                    <div className="flex flex-col items-center text-indigo-300">
                        <icons.Loader className="h-8 w-8 animate-spin mb-2" />
                        <p>Uploading your CV...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-300">
                        <icons.Upload className="h-8 w-8 mb-2 text-indigo-400" />
                        <p className="text-lg font-medium">
                            Drag & drop your CV here
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            or click to select (PDF only)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CVEditor;
