import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Skill } from "../types";
import { endpoints } from "../config/axios";
import { toast } from "react-hot-toast";
import { useAuth } from "./auth";
import { TOKEN_KEY } from "../utils";

interface SkillState {
    skills: Skill[];
    isLoading: boolean;
    error: string | null;
    fetchSkills: () => Promise<Skill[]>;
    addSkill: (skill: Skill) => Promise<boolean>;
    updateSkill: (id: number, updatedSkill: Skill) => Promise<boolean>;
    deleteSkill: (id: number) => Promise<boolean>;
}

export const useSkills = create<SkillState>()(
    persist(
        (set) => ({
            skills: [],
            isLoading: false,
            error: null,

            fetchSkills: async () => {
                set({ isLoading: true, error: null });

                try {
                    const response = await endpoints.skills.get();
                    console.log("Skills response:", response.data);

                    if (response.status === 200 && response.data) {
                        // Handle the nested data structure
                        const skillsData = response.data.data || response.data;

                        // Ensure we have an array of skills
                        const skills = Array.isArray(skillsData)
                            ? skillsData
                            : [];

                        console.log("Processed skills:", skills);
                        set({ skills, isLoading: false });
                        return skills;
                    } else {
                        throw new Error("Failed to fetch skills");
                    }
                } catch (error) {
                    console.error("Skills fetch error:", error);
                    set({
                        error: "Error fetching skills",
                        isLoading: false,
                    });
                    return [];
                }
            },

            addSkill: async (skill: Skill) => {
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
                    const response = await endpoints.skills.add(skill);
                    console.log("Add skill response:", response.data);

                    if (
                        (response.status === 201 || response.status === 200) &&
                        response.data
                    ) {
                        // Handle the nested data structure
                        const newSkillData =
                            response.data.data || response.data;
                        const newSkill = Array.isArray(newSkillData)
                            ? newSkillData[0]
                            : newSkillData;

                        console.log("Processed new skill:", newSkill);

                        set((state) => ({
                            skills: [...state.skills, newSkill],
                            isLoading: false,
                        }));
                        toast.success("Skill added successfully");
                        return true;
                    } else {
                        throw new Error("Failed to add skill");
                    }
                } catch (error) {
                    console.error("Skill add error:", error);
                    set({
                        error: "Error adding skill",
                        isLoading: false,
                    });
                    toast.error("Failed to add skill");
                    return false;
                }
            },

            updateSkill: async (id: number, updatedSkill: Skill) => {
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
                    const response = await endpoints.skills.update(
                        id,
                        updatedSkill
                    );
                    console.log("Update skill response:", response.data);

                    if (response.status === 200 && response.data) {
                        // Handle the nested data structure
                        const updatedSkillData =
                            response.data.data || response.data;
                        const finalUpdatedSkill = Array.isArray(
                            updatedSkillData
                        )
                            ? updatedSkillData[0]
                            : updatedSkillData;

                        console.log(
                            "Processed updated skill:",
                            finalUpdatedSkill
                        );

                        set((state) => ({
                            skills: state.skills.map((skill) =>
                                skill.id === id ? finalUpdatedSkill : skill
                            ),
                            isLoading: false,
                        }));
                        toast.success("Skill updated successfully");
                        return true;
                    } else {
                        throw new Error("Failed to update skill");
                    }
                } catch (error) {
                    console.error("Skill update error:", error);
                    set({
                        error: "Error updating skill",
                        isLoading: false,
                    });
                    toast.error("Failed to update skill");
                    return false;
                }
            },

            deleteSkill: async (id: number) => {
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
                    const response = await endpoints.skills.delete(id);
                    console.log(
                        "Delete skill response:",
                        response.status,
                        response.data
                    );

                    // Accept 200, 204, or any 2xx status code as success
                    if (response.status >= 200 && response.status < 300) {
                        set((state) => ({
                            skills: state.skills.filter(
                                (skill) => skill.id !== id
                            ),
                            isLoading: false,
                        }));
                        toast.success("Skill deleted successfully");
                        return true;
                    } else {
                        throw new Error(
                            `Failed to delete skill: ${response.status}`
                        );
                    }
                } catch (error) {
                    console.error("Skill deletion error:", error);
                    set({
                        error: "Error deleting skill",
                        isLoading: false,
                    });
                    toast.error("Failed to delete skill");
                    return false;
                }
            },
        }),
        {
            name: "portfolio-skills",
        }
    )
);
