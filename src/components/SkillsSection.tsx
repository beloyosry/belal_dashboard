import { FC, useState, useEffect } from "react";
import { Skill } from "../types";
import * as LucideIcons from "lucide-react";
import { useSkills } from "../lib/skills";
import { toast } from "react-hot-toast";
const icons = {
    ...LucideIcons,
};

function SkillsSection() {
    const {
        skills,
        isLoading,
        fetchSkills,
        addSkill,
        updateSkill,
        deleteSkill,
    } = useSkills();
    const [skillsForm, setSkillsForm] = useState<Skill[]>([]);
    const [newSkill, setNewSkill] = useState<Partial<Skill>>({
        category: "",
        items: [],
        color: "#1f2937",
        icon: "Code2",
    });
    const [editMode, setEditMode] = useState<boolean>(false);

    useEffect(() => {
        // Fetch skills on component mount
        console.log("Fetching skills...");
        fetchSkills().then((fetchedSkills) => {
            console.log("Skills fetched:", fetchedSkills);
        });
    }, [fetchSkills]);

    useEffect(() => {
        // Update local state when skills change
        console.log("Skills from store:", skills);
        setSkillsForm(skills);
    }, [skills]);

    const handleSkillChange = (
        index: number,
        field: string,
        value: unknown
    ) => {
        const updatedSkills = [...skillsForm];
        // Make sure we're preserving all required properties
        updatedSkills[index] = { ...updatedSkills[index], [field]: value };
        setSkillsForm(updatedSkills);
    };

    const handleNewSkillChange = (field: string, value: unknown) => {
        setNewSkill((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddSkill = async () => {
        if (!newSkill.category) {
            toast.error("Category is required");
            return;
        }

        try {
            // Create a complete skill object
            const skillToAdd = {
                id: Date.now(), // Temporary ID, will be replaced by server
                category: newSkill.category || "",
                items: newSkill.items || [],
                color: newSkill.color || "#1f2937",
                icon: newSkill.icon || "Code2",
            } as Skill;

            const success = await addSkill(skillToAdd);

            if (success) {
                // Reset new skill form
                setNewSkill({
                    category: "",
                    items: [],
                    color: "#1f2937",
                    icon: "Code2",
                });
                setEditMode(false);
            }
        } catch (error) {
            console.error("Error adding skill:", error);
            toast.error("Failed to add skill");
        }
    };

    const handleSkillSubmit = async (index: number) => {
        const skillToUpdate = skillsForm[index];

        if (!skillToUpdate) return;

        try {
            await updateSkill(skillToUpdate.id, skillToUpdate);
        } catch (error) {
            console.error("Error updating skill:", error);
            toast.error("Failed to update skill");
        }
    };

    const handleDeleteSkill = async (id: number) => {
        try {
            await deleteSkill(id);
        } catch (error) {
            console.error("Error deleting skill:", error);
            toast.error("Failed to delete skill");
        }
    };

    // Debug output
    console.log("Rendering SkillsSection with skills:", skillsForm);

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center sm:text-2xl md:text-3xl">
                Skills {isLoading ? "(Loading...)" : `(${skillsForm.length})`}
            </h2>

            {/* Debug info */}
            {skillsForm.length === 0 && !isLoading && (
                <div className="text-center text-gray-400 mb-4">
                    No skills found. Add your first skill below.
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {skillsForm.map((skill, index) => (
                    <div
                        key={skill.id}
                        className={`relative group rounded-lg shadow-md overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300`}
                        style={{
                            backgroundColor: skill.color || "#1f2937",
                        }}
                    >
                        <div className="p-5">
                            <div className="flex items-center mb-4">
                                <div className="mr-3 bg-gray-700 bg-opacity-50 rounded-full p-2">
                                    {(() => {
                                        // Dynamically render the icon by looking it up in the imported Lucide icons
                                        if (
                                            skill.icon &&
                                            typeof skill.icon === "string" &&
                                            skill.icon in icons
                                        ) {
                                            // Use proper typing to fix the TypeScript error
                                            const IconComponent = icons[
                                                skill.icon as keyof typeof icons
                                            ] as FC<{
                                                className?: string;
                                            }>;
                                            return (
                                                <IconComponent className="w-6 h-6 text-white" />
                                            );
                                        }
                                        // Fallback to a default icon (Code2) if the icon name is not valid
                                        return (
                                            <icons.Code2 className="w-6 h-6 text-white" />
                                        );
                                    })()}
                                </div>
                                <h3 className="text-lg font-medium text-white">
                                    {skill.category || "New Skill"}
                                </h3>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    className="block w-full px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={skill.category || ""}
                                    onChange={(e) =>
                                        handleSkillChange(
                                            index,
                                            "category",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g., Programming Languages"
                                    aria-label="Skill category"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Icon
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="block w-full px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                                        value={skill.icon || ""}
                                        onChange={(e) =>
                                            handleSkillChange(
                                                index,
                                                "icon",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search for an icon..."
                                        aria-label="Skill icon"
                                    />
                                    <button
                                        className="absolute inset-y-0 right-0 px-3 flex items-center bg-gray-600 rounded-r-md"
                                        onClick={() => {
                                            // You can implement a modal to search/select icons here
                                            // For now, let's just clear the icon as a toggle
                                            handleSkillChange(
                                                index,
                                                "icon",
                                                skill.icon ? "" : "Code2"
                                            );
                                        }}
                                        aria-label="Skill icon search"
                                    >
                                        <icons.Search className="h-4 w-4 text-gray-300" />
                                    </button>
                                </div>
                                {skill.icon && (
                                    <div className="mt-2 p-2 bg-gray-700 rounded-md max-h-32 overflow-y-auto">
                                        <div className="grid grid-cols-6 gap-2">
                                            {Object.keys(icons)
                                                .filter((iconName) =>
                                                    iconName
                                                        .toLowerCase()
                                                        .includes(
                                                            skill.icon?.toLowerCase() ||
                                                                ""
                                                        )
                                                )
                                                .slice(0, 18) // Limit to first 18 matches
                                                .map((iconName) => {
                                                    const IconComp = icons[
                                                        iconName as keyof typeof icons
                                                    ] as FC<{
                                                        className?: string;
                                                    }>;
                                                    return (
                                                        <div
                                                            key={iconName}
                                                            className={`p-2 cursor-pointer rounded hover:bg-gray-600 ${
                                                                skill.icon ===
                                                                iconName
                                                                    ? "bg-indigo-600"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                handleSkillChange(
                                                                    index,
                                                                    "icon",
                                                                    iconName
                                                                )
                                                            }
                                                            title={iconName}
                                                        >
                                                            <IconComp className="w-5 h-5 text-white" />
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Color
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="color"
                                        className="h-9 w-9 rounded mr-2 cursor-pointer border-0"
                                        value={skill.color || "#1f2937"}
                                        onChange={(e) =>
                                            handleSkillChange(
                                                index,
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        aria-label="Skill color"
                                    />
                                    <input
                                        type="text"
                                        className="block flex-1 px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={skill.color || ""}
                                        onChange={(e) =>
                                            handleSkillChange(
                                                index,
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        placeholder="#1f2937"
                                        aria-label="Skill color hex"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Items
                                </label>
                                <textarea
                                    className="block w-full px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={skill.items?.join("\n")}
                                    onChange={(e) =>
                                        handleSkillChange(
                                            index,
                                            "items",
                                            e.target.value.split("\n")
                                        )
                                    }
                                    placeholder="Enter one skill per line"
                                    rows={4}
                                    aria-label="Skill items"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleSkillSubmit(index)}
                                    className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label="Save skill"
                                >
                                    <icons.Save className="h-4 w-4 mr-1" />
                                    Save
                                </button>
                                <button
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label="Delete skill"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <icons.Loader className="animate-spin h-4 w-4 mr-1" />
                                    ) : (
                                        <icons.Trash2 className="h-4 w-4 mr-1" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Skill Card */}
                {editMode ? (
                    <div
                        className={`relative group rounded-lg shadow-md overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300`}
                        style={{
                            backgroundColor: newSkill.color || "#1f2937",
                        }}
                    >
                        <div className="p-5">
                            <div className="flex items-center mb-4">
                                <div className="mr-3 bg-gray-700 bg-opacity-50 rounded-full p-2">
                                    {(() => {
                                        if (
                                            newSkill.icon &&
                                            typeof newSkill.icon === "string" &&
                                            newSkill.icon in icons
                                        ) {
                                            const IconComponent = icons[
                                                newSkill.icon as keyof typeof icons
                                            ] as FC<{
                                                className?: string;
                                            }>;
                                            return (
                                                <IconComponent className="w-6 h-6 text-white" />
                                            );
                                        }
                                        return (
                                            <icons.Code2 className="w-6 h-6 text-white" />
                                        );
                                    })()}
                                </div>
                                <h3 className="text-lg font-medium text-white">
                                    {newSkill.category || "New Skill"}
                                </h3>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    className="block w-full px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSkill.category || ""}
                                    onChange={(e) =>
                                        handleNewSkillChange(
                                            "category",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g., Programming Languages"
                                    aria-label="Skill category"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Icon
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="block w-full px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                                        value={newSkill.icon || ""}
                                        onChange={(e) =>
                                            handleNewSkillChange(
                                                "icon",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search for an icon..."
                                        aria-label="Skill icon"
                                    />
                                    <button
                                        className="absolute inset-y-0 right-0 px-3 flex items-center bg-gray-600 rounded-r-md"
                                        onClick={() => {
                                            handleNewSkillChange(
                                                "icon",
                                                newSkill.icon ? "" : "Code2"
                                            );
                                        }}
                                        aria-label="Skill icon search"
                                    >
                                        <icons.Search className="h-4 w-4 text-gray-300" />
                                    </button>
                                </div>
                                {newSkill.icon && (
                                    <div className="mt-2 p-2 bg-gray-700 rounded-md max-h-32 overflow-y-auto">
                                        <div className="grid grid-cols-6 gap-2">
                                            {Object.keys(icons)
                                                .filter((iconName) =>
                                                    iconName
                                                        .toLowerCase()
                                                        .includes(
                                                            newSkill.icon?.toLowerCase() ||
                                                                ""
                                                        )
                                                )
                                                .slice(0, 18) // Limit to first 18 matches
                                                .map((iconName) => {
                                                    const IconComp = icons[
                                                        iconName as keyof typeof icons
                                                    ] as FC<{
                                                        className?: string;
                                                    }>;
                                                    return (
                                                        <div
                                                            key={iconName}
                                                            className={`p-2 cursor-pointer rounded hover:bg-gray-600 ${
                                                                newSkill.icon ===
                                                                iconName
                                                                    ? "bg-indigo-600"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                handleNewSkillChange(
                                                                    "icon",
                                                                    iconName
                                                                )
                                                            }
                                                            title={iconName}
                                                        >
                                                            <IconComp className="w-5 h-5 text-white" />
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Color
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="color"
                                        className="h-9 w-9 rounded mr-2 cursor-pointer border-0"
                                        value={newSkill.color || "#1f2937"}
                                        onChange={(e) =>
                                            handleNewSkillChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        aria-label="Skill color"
                                    />
                                    <input
                                        type="text"
                                        className="block flex-1 px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={newSkill.color || ""}
                                        onChange={(e) =>
                                            handleNewSkillChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        placeholder="#1f2937"
                                        aria-label="Skill color hex"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Items
                                </label>
                                <textarea
                                    className="block w-full px-3 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSkill.items?.join("\n") || ""}
                                    onChange={(e) =>
                                        handleNewSkillChange(
                                            "items",
                                            e.target.value.split("\n")
                                        )
                                    }
                                    placeholder="Enter one skill per line"
                                    rows={4}
                                    aria-label="Skill items"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleAddSkill}
                                    className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label="Save skill"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <icons.Loader className="animate-spin h-4 w-4 mr-1" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <icons.Save className="h-4 w-4 mr-1" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label="Cancel"
                                >
                                    <icons.X className="h-4 w-4 mr-1" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="relative group bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300 flex items-center justify-center min-h-[18rem] cursor-pointer"
                        onClick={() => setEditMode(true)}
                    >
                        <div className="text-center p-5">
                            <div className="mb-3 bg-indigo-600 rounded-full p-3 inline-flex">
                                <icons.Plus className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-gray-300 font-medium">
                                Add New Skill
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SkillsSection;
