import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
    Plus,
    Pencil,
    Trash2,
    ExternalLink,
    Github,
    GripVertical,
} from "lucide-react";
import { Project } from "../types";
import ProjectForm from "../components/ProjectForm";
import {
    useDeleteProject,
    useProjectsList,
    updateProjectOrderDirectly,
} from "../api/projects";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../components/StrictModeDroppable";

export default function Dashboard() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [localProjects, setLocalProjects] = useState<Project[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const {
        data: projects = [],
        isLoading,
        error,
        refetch,
    } = useProjectsList();
    const { mutate: deleteProject } = useDeleteProject();

    // Initialize local projects when data is loaded
    useEffect(() => {
        if (projects?.length > 0 && !isLoaded) {
            // Projects are now fetched in descending order (highest order first)
            // So we keep them in that order for display
            setLocalProjects([...projects]);
            setIsLoaded(true);
        }
    }, [projects, isLoaded]);

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

    if (isLoading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-white">Error</div>;

    // Ensure we have projects loaded
    if (localProjects.length === 0 && projects.length > 0 && !isLoaded) {
        // Projects are already sorted in descending order from the API
        setLocalProjects([...projects]);
        setIsLoaded(true);
    }

    return (
        <div className="bg-gray-900 h-auto overflow-y-auto overflow-hidden p-6">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-white">
                        Projects
                    </h1>
                    <p className="mt-2 text-sm text-gray-300">
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
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto"
                    >
                        <Plus className="h-4 w-4 mr-2" />
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
                                            <th className="w-10 px-3 py-3.5"></th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Project
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Technologies
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Type
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Category
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Status
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Year
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">
                                                Links
                                            </th>
                                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
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
                                                                        className="whitespace-nowrap px-3 py-4 text-sm text-gray-400"
                                                                        {...provided.dragHandleProps}
                                                                    >
                                                                        <GripVertical className="h-5 w-5 cursor-grab" />
                                                                    </td>
                                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                                        <div className="flex items-center">
                                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                                <img
                                                                                    className="h-10 w-10 rounded-full object-cover"
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
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {project.technologies.map(
                                                                                (
                                                                                    tech
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            tech
                                                                                        }
                                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200"
                                                                                    >
                                                                                        {
                                                                                            tech
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-200">
                                                                            {
                                                                                project.type
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200">
                                                                            {
                                                                                project.category
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                                        <span
                                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                                        {
                                                                            project.year
                                                                        }
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
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
                                                                                <ExternalLink className="h-5 w-5" />
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
                                                                                    <Github className="h-5 w-5" />
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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
                                                                                <Pencil className="h-5 w-5" />
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
                                                                                <Trash2 className="h-5 w-5" />
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
