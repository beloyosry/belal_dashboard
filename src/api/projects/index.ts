import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { InsertTables, UpdateTables } from "../../types";

export const useProjectsList = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("order", { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
    });
};

export const useInsertProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn(projectData: InsertTables<"projects">) {
            const { error } = await supabase
                .from("projects")
                .insert([projectData]);
            if (error) {
                throw new Error(error.message);
            }
        },
        async onSuccess() {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn({
            id,
            ...projectData
        }: UpdateTables<"projects"> & { id: string }) {
            // Log what we're updating to help debug
            console.log("Updating project", id, "with data:", projectData);

            const { data, error } = await supabase
                .from("projects")
                .update(projectData)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Supabase update error:", error);
                throw new Error(error.message);
            }

            return data;
        },
        async onSuccess() {
            // Invalidate and refetch projects after update
            await queryClient.invalidateQueries({
                queryKey: ["projects"],
            });
        },
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn(id: string) {
            const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", id);
            if (error) {
                throw new Error(error.message);
            }
        },
        async onSuccess() {
            await queryClient.invalidateQueries({
                queryKey: ["projects"],
            });
        },
    });
};

// Direct function to update a project's order
export const updateProjectOrderDirectly = async (
    projectId: string,
    newOrder: number
) => {
    console.log(
        `Direct API: Updating project ${projectId} to order ${newOrder}`
    );

    try {
        // Get the session to check authentication
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
            console.error("No active session found");
            return { success: false, error: "Not authenticated" };
        }

        // Execute the update with the user's auth
        const { data, error } = await supabase
            .from("projects")
            .update({ order: newOrder, updated_at: new Date().toISOString() })
            .eq("id", projectId)
            .select();

        if (error) {
            console.error("Direct update error:", error);
            return { success: false, error: error.message };
        }

        console.log("Direct update success:", data);
        return { success: true, data };
    } catch (err) {
        console.error("Exception during direct update:", err);
        return { success: false, error: String(err) };
    }
};
