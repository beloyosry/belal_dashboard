import React, { useState, useEffect } from "react";
import { uploadCV, getCVUrl, downloadCV } from "../api/cv";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

const CVUploader: React.FC = () => {
    const [cvUrl, setCvUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setCvUrl(getCVUrl());
    }, []);

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setIsUploading(true);

        toast("Uploading CV...");

        const url = await uploadCV(acceptedFiles[0]);
        if (url) {
            setCvUrl(url);
            toast.success("CV uploaded successfully!");
        } else {
            toast.error("Failed to upload CV.");
        }

        setIsUploading(false);
    };

    const handleDownload = async () => {
        await downloadCV()
            .then(() => {
                toast.success("CV downloaded successfully!");
            })
            .catch(() => {
                toast.error("Failed to download CV.");
            });
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
    });

    return (
        <div className="p-6 border rounded-lg shadow-md bg-white dark:bg-gray-800 dark:text-white">
            {cvUrl ? (
                <div className="flex flex-col items-center">
                    <p className="text-lg font-medium">Current CV:</p>
                    <button
                        type="button"
                        className="mt-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                        onClick={handleDownload}
                    >
                        Download CV
                    </button>
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">
                    No CV uploaded yet.
                </p>
            )}

            <div
                {...getRootProps()}
                className="mt-4 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                <input {...getInputProps()} />
                {isUploading ? (
                    <p className="text-blue-500 dark:text-blue-300">
                        Uploading...
                    </p>
                ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                        Drag & drop your CV here, or click to select
                    </p>
                )}
            </div>
        </div>
    );
};

export default CVUploader;
