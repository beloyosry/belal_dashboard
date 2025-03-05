import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { User } from "../../types";
import { UpdateTables } from "../../types";

export const useUserData = () => {
    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const { data, error } = await supabase.from("user").select("*");

            if (error) {
                throw new Error(error.message);
            }

            if (!data) {
                throw new Error("No user data found");
            }

            return data as User[];
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        async mutationFn({
            id,
            ...userData
        }: UpdateTables<"user"> & { id: number }) {
            // Log what we're updating to help debug
            console.log("Updating user", id, "with data:", userData);

            const { data, error } = await supabase
                .from("user")
                .update(userData)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Supabase update error:", error);
                throw new Error(error.message);
            }

            return data;
        },
        async onSuccess() {
            // Invalidate and refetch user data after update
            await queryClient.invalidateQueries({
                queryKey: ["user"],
            });
        },
    });
};
