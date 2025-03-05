import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import { Project, InsertTables } from "../types";
import { useInsertProject, useUpdateProject } from "../api/projects";
import { useAuth } from "../providers/AuthProvider";

interface ProjectFormProps {
    project?: Project | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProjectForm({
    project,
    onClose,
    onSuccess,
}: ProjectFormProps) {
    const { session } = useAuth();
    const { mutate: insertProject } = useInsertProject();
    const { mutate: updateProject } = useUpdateProject();

    const [formData, setFormData] = useState<
        Omit<InsertTables<"projects">, "technologies">
    >({
        title: project?.title || "",
        description: project?.description || "",
        image_url: project?.image_url || "",
        live_url: project?.live_url || "",
        github_url: project?.github_url || null,
        order: project?.order || 0, // Keep this for database consistency
        user_id: project?.user_id || session?.user?.id || "",
        type: project?.type || "web",
        category: project?.category || "frontend",
        status: project?.status || "completed",
        year: project?.year || new Date().getFullYear(),
    });

    // Store technologies as a comma-separated string for the form input
    const [technologiesInput, setTechnologiesInput] = useState<string[]>(
        project?.technologies?.map((tech) => tech.trim()) || []
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const technologiesArray = technologiesInput
            .map((tech) => tech.trim())
            .filter(Boolean);

        try {
            if (project) {
                updateProject(
                    {
                        id: project.id,
                        ...formData,
                        technologies: technologiesArray,
                    },
                    {
                        onSuccess: () => {
                            toast.success("Project updated successfully");
                            onSuccess();
                        },
                        onError: (error) => {
                            toast.error("Failed to update project" + error);
                        },
                    }
                );
            } else {
                insertProject(
                    {
                        ...formData,
                        technologies: technologiesArray,
                    },
                    {
                        onSuccess: () => {
                            toast.success("Project created successfully");
                            onSuccess();
                        },
                        onError: (error) => {
                            toast.error("Failed to create project" + error);
                        },
                    }
                );
            }
        } catch (error) {
            toast.error("Failed to save project" + error);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-medium text-white">
                        {project ? "Edit Project" : "Add New Project"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200"
                        aria-label="Close form"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-200"
                        >
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-200"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="type"
                                className="block text-sm font-medium text-gray-200"
                            >
                                Project Type
                            </label>
                            <select
                                id="type"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        type: e.target.value as
                                            | "web"
                                            | "mobile",
                                    })
                                }
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="web">Web</option>
                                <option value="mobile">Mobile</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="category"
                                className="block text-sm font-medium text-gray-200"
                            >
                                Category
                            </label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value as
                                            | "frontend"
                                            | "fullstack",
                                    })
                                }
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="frontend">Frontend</option>
                                <option value="fullstack">Fullstack</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="status"
                                className="block text-sm font-medium text-gray-200"
                            >
                                Status
                            </label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        status: e.target.value as
                                            | "completed"
                                            | "in-progress"
                                            | "featured",
                                    })
                                }
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="featured">Featured</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="year"
                                className="block text-sm font-medium text-gray-200"
                            >
                                Year
                            </label>
                            <input
                                id="year"
                                type="number"
                                value={formData.year}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        year:
                                            parseInt(e.target.value) ||
                                            new Date().getFullYear(),
                                    })
                                }
                                min="2000"
                                max={new Date().getFullYear() + 1}
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="image_url"
                            className="block text-sm font-medium text-gray-200"
                        >
                            Image URL
                        </label>
                        <input
                            id="image_url"
                            type="url"
                            value={formData.image_url}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    image_url: e.target.value,
                                })
                            }
                            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="live_url"
                            className="block text-sm font-medium text-gray-200"
                        >
                            Live URL
                        </label>
                        <input
                            id="live_url"
                            type="url"
                            value={formData.live_url}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    live_url: e.target.value,
                                })
                            }
                            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="github_url"
                            className="block text-sm font-medium text-gray-200"
                        >
                            GitHub URL
                        </label>
                        <input
                            id="github_url"
                            type="url"
                            value={formData.github_url!}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    github_url: e.target.value,
                                })
                            }
                            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="technologies"
                            className="block text-sm font-medium text-gray-200"
                        >
                            Technologies (comma-separated)
                        </label>
                        <input
                            id="technologies"
                            type="text"
                            value={technologiesInput.join(", ")}
                            onChange={(e) =>
                                setTechnologiesInput(e.target.value.split(", "))
                            }
                            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                        >
                            {project ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
