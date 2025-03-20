import { useState, useEffect, useCallback, FC } from "react";
import { toast } from "react-hot-toast";
import * as LucideIcons from "lucide-react";
import { Project, Skill, User } from "../types";
import ProjectForm from "../components/ProjectForm";
import CVEditor from "../components/CVEditor";
import {
    useDeleteProject,
    useProjectsList,
    updateProjectOrderDirectly,
} from "../api/projects";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../components/StrictModeDroppable";
import { useUserData, useUpdateUser } from "../api/user";
import {
    useSkillsList,
    useUpdateSkill,
    useInsertSkill,
    useDeleteSkill,
} from "../api/skills";

const icons = {
    ...LucideIcons,
};

export default function Dashboard() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [localProjects, setLocalProjects] = useState<Project[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const {
        data: projects = [],
        isLoading: projectsLoading,
        error: projectsError,
        refetch,
    } = useProjectsList();

    const { mutate: deleteProject } = useDeleteProject();

    const {
        data: userData = [],
        isLoading: userLoading,
        error: userError,
    } = useUserData();
    const { mutate: updateUser } = useUpdateUser();

    const {
        data: skills = [],
        isLoading: skillsLoading,
        error: skillsError,
    } = useSkillsList();
    const { mutate: updateSkill } = useUpdateSkill();
    const { mutate: insertSkill } = useInsertSkill();
    const { mutate: deleteSkill } = useDeleteSkill();

    const [userForm, setUserForm] = useState<User | null>(null);
    const [skillsForm, setSkillsForm] = useState<Skill[]>(skills || []);

    const [userFormModified, setUserFormModified] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);

    useEffect(() => {
        if (projects?.length > 0 && !isLoaded) {
            // Projects are now fetched in descending order (highest order first)
            // So we keep them in that order for display
            setLocalProjects([...projects]);
            setIsLoaded(true);
        }
    }, [projects, isLoaded]);

    useEffect(() => {
        if (userData && userData.length > 0) {
            const user = userData[0];
            if (user.id !== undefined) {
                setUserForm({
                    id: user.id,
                    about: user.about || null,
                    image_url: user.image_url || null,
                    github: user.github || null,
                    linkedin: user.linkedin || null,
                    email: user.email || null,
                });
            } else {
                console.error("User data is missing an id:", user);
            }
        }
    }, [userData]);

    useEffect(() => {
        if (skills) {
            setSkillsForm(skills);
        }
    }, [skills]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this project?"))
            return;

        deleteProject(id, {
            onSuccess: () => {
                toast.success("Project deleted successfully");
                refetch();
                setLocalProjects((prev) => prev.filter((p) => p.id !== id));
            },
            onError: (error) => {
                toast.error("Failed to delete project" + error);
            },
        });
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setIsFormOpen(true);
    };

    const handleUserChange = (field: string, value: unknown) => {
        if (userForm) {
            setUserForm({ ...userForm, [field]: value });
            setUserFormModified(true);
        }
    };

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

    const handleUserSubmit = () => {
        if (userForm) {
            updateUser(userForm, {
                onSuccess: () => {
                    toast.success("User updated successfully");
                    setUserFormModified(false);
                },
                onError: (error) => {
                    toast.error("Failed to update user" + error);
                },
            });
        }
    };

    const handleSkillSubmit = (index: number) => {
        const skill = skillsForm[index];
        if (skill && skill.id !== undefined) {
            updateSkill(skill, {
                onSuccess: () => {
                    toast.success("Skill updated successfully");
                },
                onError: (error) => {
                    toast.error("Failed to update skill" + error);
                },
            });
        }
    };

    const onDragEnd = useCallback(
        async (result: DropResult) => {
            const { destination, source } = result;

            // If dropped outside the list or no movement
            if (
                !destination ||
                (destination.droppableId === source.droppableId &&
                    destination.index === source.index)
            ) {
                return;
            }

            // Create a new array to avoid mutation issues
            const items = Array.from(localProjects);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);

            // Update local state with new project orders - order is reversed
            // so highest index is displayed first (at top of table)
            const total = items.length - 1;
            const updatedItems = items.map((item, index) => ({
                ...item,
                order: total - index, // Reverse the order
            }));

            // Update UI immediately (optimistic update)
            setLocalProjects(updatedItems);

            // Show a loading toast
            const toastId = toast.loading("Updating project order...");

            try {
                // Process all updates using our direct API
                const updateResults = await Promise.all(
                    updatedItems.map((project) =>
                        updateProjectOrderDirectly(project.id, project.order)
                    )
                );

                // Check if any updates failed
                const failures = updateResults.filter(
                    (result) => !result.success
                );
                if (failures.length > 0) {
                    console.error("Some updates failed:", failures);
                    toast.dismiss(toastId);
                    toast.error(
                        `Failed to update some projects: ${failures[0].error}`
                    );

                    // Reset to original order
                    const sortedProjects = [...projects];
                    setLocalProjects(sortedProjects);
                    return;
                }

                // All updates succeeded
                toast.dismiss(toastId);
                toast.success("Project order updated successfully");

                // Refresh data from server
                refetch();
            } catch (error) {
                console.error("Error in drag end handler:", error);
                toast.dismiss(toastId);
                toast.error("An unexpected error occurred");

                // Reset to original order
                const sortedProjects = [...projects];
                setLocalProjects(sortedProjects);
            }
        },
        [localProjects, projects, refetch]
    );

    if (projectsLoading || userLoading || skillsLoading)
        return <div className="text-white">Loading...</div>;
    if (projectsError)
        return (
            <div className="text-white">
                Error loading projects: {projectsError?.message}
            </div>
        );
    if (userError)
        return (
            <div className="text-white">
                Error loading user data: {userError?.message}
            </div>
        );
    if (skillsError)
        return (
            <div className="text-white">
                Error loading skills: {skillsError?.message}
            </div>
        );

    // Ensure we have projects loaded
    if (localProjects.length === 0 && projects.length > 0 && !isLoaded) {
        // Projects are already sorted in descending order from the API
        setLocalProjects([...projects]);
        setIsLoaded(true);
    }

    return (
        <div className="bg-gray-900 h-auto overflow-y-auto overflow-hidden p-6 sm:p-8 md:p-10 lg:p-12">
            {/* User Information Section */}
            <div className="mt-8 max-w-3xl mx-auto">
                <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
                    <div className="flex flex-col items-center">
                        {/* Profile Image */}
                        <div className="relative mb-6 group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg">
                                {editingField === "image_url" ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
                                        <input
                                            type="text"
                                            className="w-48 px-2 py-1 text-sm bg-gray-700 border border-indigo-400 rounded text-white"
                                            value={userForm?.image_url || ""}
                                            onChange={(e) =>
                                                handleUserChange(
                                                    "image_url",
                                                    e.target.value
                                                )
                                            }
                                            onBlur={() => setEditingField(null)}
                                            autoFocus
                                            aria-label="Profile image URL"
                                            placeholder="Enter image URL"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={
                                            userForm?.image_url ||
                                            "https://via.placeholder.com/150"
                                        }
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <button
                                    className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setEditingField("image_url")}
                                    aria-label="Edit profile image"
                                >
                                    <icons.Pencil className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="relative group mb-2 w-full text-center">
                            {editingField === "email" ? (
                                <input
                                    type="email"
                                    className="px-2 py-1 text-white bg-gray-700 border border-indigo-400 rounded text-center"
                                    value={userForm?.email || ""}
                                    onChange={(e) =>
                                        handleUserChange(
                                            "email",
                                            e.target.value
                                        )
                                    }
                                    onBlur={() => setEditingField(null)}
                                    autoFocus
                                    aria-label="Email address"
                                    placeholder="Enter your email"
                                />
                            ) : (
                                <p
                                    className="text-indigo-300 text-lg font-medium cursor-pointer hover:text-indigo-200 transition-colors"
                                    onClick={() => setEditingField("email")}
                                >
                                    {userForm?.email || "Add your email"}
                                </p>
                            )}
                            <button
                                className="absolute right-64 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setEditingField("email")}
                                aria-label="Edit email address"
                            >
                                <icons.Pencil className="h-3 w-3 text-gray-400" />
                            </button>
                        </div>

                        {/* Social Links */}
                        <div className="flex space-x-4 mb-8">
                            {/* GitHub */}
                            <div className="relative group">
                                {editingField === "github" ? (
                                    <input
                                        type="text"
                                        className="px-2 py-1 text-white bg-gray-700 border border-indigo-400 rounded"
                                        value={userForm?.github || ""}
                                        onChange={(e) =>
                                            handleUserChange(
                                                "github",
                                                e.target.value
                                            )
                                        }
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        aria-label="GitHub URL"
                                        placeholder="Enter GitHub URL"
                                    />
                                ) : (
                                    <a
                                        href={userForm?.github || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                        onClick={(e) => {
                                            if (!userForm?.github) {
                                                e.preventDefault();
                                                setEditingField("github");
                                            }
                                        }}
                                    >
                                        <icons.Github className="h-6 w-6 text-gray-300 hover:text-white transition-colors" />
                                    </a>
                                )}
                                <button
                                    className="absolute -right-4 -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setEditingField("github")}
                                    aria-label="Edit GitHub link"
                                >
                                    <icons.Pencil className="h-3 w-3 text-gray-400" />
                                </button>
                            </div>

                            {/* LinkedIn */}
                            <div className="relative group">
                                {editingField === "linkedin" ? (
                                    <input
                                        type="text"
                                        className="px-2 py-1 text-white bg-gray-700 border border-indigo-400 rounded"
                                        value={userForm?.linkedin || ""}
                                        onChange={(e) =>
                                            handleUserChange(
                                                "linkedin",
                                                e.target.value
                                            )
                                        }
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        aria-label="LinkedIn URL"
                                        placeholder="Enter LinkedIn URL"
                                    />
                                ) : (
                                    <a
                                        href={userForm?.linkedin || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                        onClick={(e) => {
                                            if (!userForm?.linkedin) {
                                                e.preventDefault();
                                                setEditingField("linkedin");
                                            }
                                        }}
                                    >
                                        <icons.Linkedin className="h-6 w-6 text-gray-300 hover:text-white transition-colors" />
                                    </a>
                                )}
                                <button
                                    className="absolute -right-4 -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setEditingField("linkedin")}
                                    aria-label="Edit LinkedIn link"
                                >
                                    <icons.Pencil className="h-3 w-3 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* About Me */}
                        <div className="relative group w-full mb-4">
                            <h3 className="text-xl font-semibold text-white mb-2 text-center">
                                About Me
                            </h3>
                            {editingField === "about" ? (
                                <textarea
                                    className="w-full px-4 py-2 rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={userForm?.about?.join("\n") || ""}
                                    onChange={(e) =>
                                        handleUserChange(
                                            "about",
                                            e.target.value.split("\n")
                                        )
                                    }
                                    onBlur={() => setEditingField(null)}
                                    rows={5}
                                    autoFocus
                                    aria-label="About me description"
                                    placeholder="Write about yourself here..."
                                />
                            ) : (
                                <div
                                    className="text-gray-300 cursor-pointer hover:bg-gray-700 p-4 rounded-md transition-colors"
                                    onClick={() => setEditingField("about")}
                                >
                                    {userForm?.about ? (
                                        userForm.about.map((paragraph, i) => (
                                            <p key={i} className="mb-2">
                                                {paragraph}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 italic">
                                            Click to add your bio
                                        </p>
                                    )}
                                </div>
                            )}
                            <button
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setEditingField("about")}
                                aria-label="Edit about me section"
                            >
                                <icons.Pencil className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Save Button - Only show when changes have been made */}
                        {userFormModified && (
                            <button
                                onClick={handleUserSubmit}
                                className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CV Management Section */}
            <div className="mt-8 max-w-3xl mx-auto">
                <CVEditor />
            </div>

            {/* Skills Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-white mb-6 text-center sm:text-2xl md:text-3xl">
                    Skills
                </h2>
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
                                                typeof skill.icon ===
                                                    "string" &&
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
                                        onClick={() => {
                                            if (skill.id !== undefined) {
                                                deleteSkill(skill.id);
                                            }
                                        }}
                                        className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        aria-label="Delete skill"
                                    >
                                        <icons.Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Skill Card */}
                    <div
                        className="relative group bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300 flex items-center justify-center min-h-[18rem] cursor-pointer"
                        onClick={() =>
                            insertSkill({
                                category: "",
                                items: [],
                                color: "#1f2937",
                                icon: "Code2",
                                // Other fields are optional according to Insert type
                            })
                        }
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
                </div>
            </div>

            {/* Projects Section */}
            <div className="my-10">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                            Projects
                        </h1>
                        <p className="mt-2 text-sm text-gray-300 sm:text-base">
                            Manage your portfolio projects and featured websites
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingProject(null);
                                setIsFormOpen(true);
                            }}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto"
                        >
                            <icons.Plus className="h-4 w-4 mr-2 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                            Add project
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-gray-700 ring-opacity-50 md:rounded-lg">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-800">
                                            <tr>
                                                <th className="w-10 px-3 py-3.5 sm:w-12 "></th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Project
                                                </th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Technologies
                                                </th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Type
                                                </th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Category
                                                </th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Status
                                                </th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Year
                                                </th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100 sm:text-base">
                                                    Links
                                                </th>
                                                <th className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 md:pr-8">
                                                    <span className="sr-only">
                                                        Actions
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <StrictModeDroppable
                                            droppableId="projects-table"
                                            type="PROJECT_LIST"
                                        >
                                            {(provided) => (
                                                <tbody
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className="divide-y divide-gray-700 bg-gray-800"
                                                >
                                                    {localProjects.map(
                                                        (project, index) => (
                                                            <Draggable
                                                                key={project.id}
                                                                draggableId={
                                                                    project.id
                                                                }
                                                                index={index}
                                                            >
                                                                {(
                                                                    provided,
                                                                    snapshot
                                                                ) => (
                                                                    <tr
                                                                        ref={
                                                                            provided.innerRef
                                                                        }
                                                                        {...provided.draggableProps}
                                                                        style={{
                                                                            ...provided
                                                                                .draggableProps
                                                                                .style,
                                                                            background:
                                                                                snapshot.isDragging
                                                                                    ? "#4B5563"
                                                                                    : undefined,
                                                                        }}
                                                                        className={`hover:bg-gray-700`}
                                                                    >
                                                                        <td
                                                                            className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 sm:px-4"
                                                                            {...provided.dragHandleProps}
                                                                        >
                                                                            <icons.GripVertical className="h-5 w-5 cursor-grab sm:h-6 sm:w-6 " />
                                                                        </td>
                                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 md:pl-8">
                                                                            <div className="flex items-center">
                                                                                <div className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12 md:h-14 ">
                                                                                    <img
                                                                                        className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12 md:h-14 "
                                                                                        src={
                                                                                            project.image_url
                                                                                        }
                                                                                        alt=""
                                                                                    />
                                                                                </div>
                                                                                <div className="ml-4">
                                                                                    <div className="font-medium text-white">
                                                                                        {
                                                                                            project.title
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-gray-300">
                                                                                        {
                                                                                            project.description
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 sm:px-4">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {project.technologies.map(
                                                                                    (
                                                                                        tech
                                                                                    ) => (
                                                                                        <span
                                                                                            key={
                                                                                                tech
                                                                                            }
                                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200 sm:text-sm"
                                                                                        >
                                                                                            {
                                                                                                tech
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 sm:px-4">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-200 sm:text-sm">
                                                                                {
                                                                                    project.type
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 sm:px-4">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200 sm:text-sm">
                                                                                {
                                                                                    project.category
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 sm:px-4">
                                                                            <span
                                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium sm:text-sm ${
                                                                                    project.status ===
                                                                                    "featured"
                                                                                        ? "bg-green-900 text-green-200"
                                                                                        : project.status ===
                                                                                          "completed"
                                                                                        ? "bg-blue-900 text-blue-200"
                                                                                        : "bg-yellow-900 text-yellow-200"
                                                                                }`}
                                                                            >
                                                                                {project.status ===
                                                                                "in-progress"
                                                                                    ? "In Progress"
                                                                                    : project.status
                                                                                          .charAt(
                                                                                              0
                                                                                          )
                                                                                          .toUpperCase() +
                                                                                      project.status.slice(
                                                                                          1
                                                                                      )}
                                                                            </span>
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 sm:px-4">
                                                                            {
                                                                                project.year
                                                                            }
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 sm:px-4">
                                                                            <div className="flex space-x-2">
                                                                                <a
                                                                                    href={
                                                                                        project.live_url
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-gray-400 hover:text-gray-200"
                                                                                    aria-label="View live site"
                                                                                >
                                                                                    <icons.ExternalLink className="h-5 w-5  " />
                                                                                </a>
                                                                                {project.github_url && (
                                                                                    <a
                                                                                        href={
                                                                                            project.github_url
                                                                                        }
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-gray-400 hover:text-gray-200"
                                                                                        aria-label="View GitHub repository"
                                                                                    >
                                                                                        <icons.Github className="h-5 w-5  " />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 md:pr-8">
                                                                            <div className="flex justify-end space-x-2">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleEdit(
                                                                                            project as Project
                                                                                        )
                                                                                    }
                                                                                    className="text-indigo-400 hover:text-indigo-300"
                                                                                    aria-label="Edit project"
                                                                                >
                                                                                    <icons.Pencil className="h-5 w-5  " />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleDelete(
                                                                                            project.id
                                                                                        )
                                                                                    }
                                                                                    className="text-red-400 hover:text-red-300"
                                                                                    aria-label="Delete project"
                                                                                >
                                                                                    <icons.Trash2 className="h-5 w-5  " />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </Draggable>
                                                        )
                                                    )}
                                                    {provided.placeholder}
                                                </tbody>
                                            )}
                                        </StrictModeDroppable>
                                    </table>
                                </DragDropContext>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <ProjectForm
                    project={editingProject}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingProject(null);
                    }}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        setEditingProject(null);
                        refetch();
                        setIsLoaded(false);
                    }}
                />
            )}
        </div>
    );
}
