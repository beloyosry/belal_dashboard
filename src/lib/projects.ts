import { create } from "zustand";
import { Project } from "../types";
import { persist } from "zustand/middleware";
import { endpoints } from "../config/axios";
import { useAuth } from "./auth";
import { TOKEN_KEY } from "../utils";
import toast from "react-hot-toast";

interface ProjectState {
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    fetchProjects: () => Promise<Project[]>;
    addProject: (project: Project) => Promise<boolean>;
    updateProject: (id: number, updatedProject: Project) => Promise<boolean>;
    deleteProject: (id: number) => Promise<boolean>;
}

export const useProjects = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],
            isLoading: false,
            error: null,

            fetchProjects: async () => {
                set({ isLoading: true, error: null });

                try {
                    const response = await endpoints.projects.get();
                    console.log("Projects response:", response.data);

                    if (response.status === 200 && response.data) {
                        // Handle the nested data structure
                        const projectsData =
                            response.data.data || response.data;

                        // Ensure we have an array of projects
                        const projects = Array.isArray(projectsData)
                            ? projectsData
                            : [];

                        console.log("Processed projects:", projects);
                        set({ projects, isLoading: false });
                        return projects;
                    } else {
                        throw new Error("Failed to fetch projects");
                    }
                } catch (error) {
                    console.error("Projects fetch error:", error);
                    set({
                        error: "Error fetching projects",
                        isLoading: false,
                    });
                    return [];
                }
            },

            addProject: async (project: Project) => {
                set({ isLoading: true, error: null });

                // Get token from auth store or localStorage
                const token =
                    useAuth.getState().token || localStorage.getItem(TOKEN_KEY);

                if (!token) {
                    set({
                        error: "Authentication required. Please log in.",
                        isLoading: false,
                    });
                    toast.error("Authentication required");
                    return false;
                }

                try {
                    const response = await endpoints.projects.add(project);
                    console.log("Add project response:", response.data);

                    if (
                        (response.status === 201 || response.status === 200) &&
                        response.data
                    ) {
                        // Handle the nested data structure
                        const newProjectData =
                            response.data.data || response.data;
                        const newProject = Array.isArray(newProjectData)
                            ? newProjectData[0]
                            : newProjectData;

                        console.log("Processed new project:", newProject);

                        set((state) => ({
                            projects: [...state.projects, newProject],
                            isLoading: false,
                        }));
                        toast.success("Project added successfully");
                        return true;
                    } else {
                        throw new Error("Failed to add project");
                    }
                } catch (error) {
                    console.error("Project add error:", error);
                    set({
                        error: "Error adding project",
                        isLoading: false,
                    });
                    toast.error("Failed to add project");
                    return false;
                }
            },

            updateProject: async (id: number, updatedProject: Project) => {
                set({ isLoading: true, error: null });

                // Get token from auth store or localStorage
                const token =
                    useAuth.getState().token || localStorage.getItem(TOKEN_KEY);

                if (!token) {
                    set({
                        error: "Authentication required. Please log in.",
                        isLoading: false,
                    });
                    toast.error("Authentication required");
                    return false;
                }

                try {
                    const response = await endpoints.projects.update(
                        id,
                        updatedProject
                    );
                    console.log("Update project response:", response.data);

                    if (response.status === 200 && response.data) {
                        // Handle the nested data structure
                        const updatedProjectData =
                            response.data.data || response.data;
                        const finalUpdatedProject = Array.isArray(
                            updatedProjectData
                        )
                            ? updatedProjectData[0]
                            : updatedProjectData;

                        console.log(
                            "Processed updated project:",
                            finalUpdatedProject
                        );

                        set((state) => ({
                            projects: state.projects.map((project) =>
                                project.id === id
                                    ? finalUpdatedProject
                                    : project
                            ),
                            isLoading: false,
                        }));
                        toast.success("Project updated successfully");
                        return true;
                    } else {
                        throw new Error("Failed to update project");
                    }
                } catch (error) {
                    console.error("Project update error:", error);
                    set({
                        error: "Error updating project",
                        isLoading: false,
                    });
                    toast.error("Failed to update project");
                    return false;
                }
            },

            deleteProject: async (id: number) => {
                set({ isLoading: true, error: null });

                // Get token from auth store or localStorage
                const token =
                    useAuth.getState().token || localStorage.getItem(TOKEN_KEY);

                if (!token) {
                    set({
                        error: "Authentication required. Please log in.",
                        isLoading: false,
                    });
                    toast.error("Authentication required");
                    return false;
                }

                try {
                    const response = await endpoints.projects.delete(id);
                    console.log(
                        "Delete project response:",
                        response.status,
                        response.data
                    );

                    // Accept 200, 204, or any 2xx status code as success
                    if (response.status >= 200 && response.status < 300) {
                        set((state) => ({
                            projects: state.projects.filter(
                                (project) => project.id !== id
                            ),
                            isLoading: false,
                        }));
                        toast.success("Project deleted successfully");
                        return true;
                    } else {
                        throw new Error(
                            `Failed to delete project: ${response.status}`
                        );
                    }
                } catch (error) {
                    console.error("Project deletion error:", error);
                    set({
                        error: "Error deleting project",
                        isLoading: false,
                    });
                    toast.error("Failed to delete project");
                    return false;
                }
            },
        }),
        {
            name: "portfolio-projects",
        }
    )
);
