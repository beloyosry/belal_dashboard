import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Skill } from "../../types";
import { InsertTables, UpdateTables } from "../../types";

export const useSkillsList = () => {
    return useQuery({
        queryKey: ["skills"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("skills")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            return data as Skill[];
        },
    });
};

export const useUpdateSkill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn({
            id,
            ...skillData
        }: UpdateTables<"skills"> & { id: number }) {
            // Log what we're updating to help debug
            console.log("Updating skill", id, "with data:", skillData);

            const { data, error } = await supabase
                .from("skills")
                .update(skillData)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Supabase update error:", error);
                throw new Error(error.message);
            }

            return data;
        },
        async onSuccess() {
            // Invalidate and refetch skills after update
            await queryClient.invalidateQueries({
                queryKey: ["skills"],
            });
        },
    });
};

export const useInsertSkill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn(skillData: InsertTables<"skills">) {
            const { error } = await supabase.from("skills").insert([skillData]);
            if (error) {
                throw new Error(error.message);
            }
        },
        async onSuccess() {
            queryClient.invalidateQueries({ queryKey: ["skills"] });
        },
    });
};

export const useDeleteSkill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn(id: number) {
            const { error } = await supabase
                .from("skills")
                .delete()
                .eq("id", id);
            if (error) {
                throw new Error(error.message);
            }
        },
        async onSuccess() {
            await queryClient.invalidateQueries({
                queryKey: ["skills"],
            });
        },
    });
};
