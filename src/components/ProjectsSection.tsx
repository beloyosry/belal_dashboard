import { useCallback, useEffect, useState } from "react";
import { Project } from "../types";
import * as LucideIcons from "lucide-react";
import { StrictModeDroppable } from "./StrictModeDroppable";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { useProjects } from "../lib/projects";
import toast from "react-hot-toast";
import { endpoints } from "../config/axios";

const icons = {
    ...LucideIcons,
};

type Props = {
    setIsFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setEditingProject: React.Dispatch<React.SetStateAction<Project | null>>;
};

function ProjectsSection({ setIsFormOpen, setEditingProject }: Props) {
    const { projects, isLoading, fetchProjects, deleteProject, updateProject } =
        useProjects();

    const [projectsForm, setProjectsForm] = useState<Project[]>([]);

    // Function to ensure minimum order is 1 and normalize orders
    const normalizeOrders = useCallback((items: Project[]) => {
        // Sort by current order
        const sortedItems = [...items].sort((a, b) => a.order - b.order);

        // Assign new orders starting from 1
        return sortedItems.map((item, index) => ({
            ...item,
            order: index + 1, // Start from 1
        }));
    }, []);

    useEffect(() => {
        // Fetch projects on component mount
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        // Update local state when projects change
        setProjectsForm(projects);
    }, [projects]);

    // Normalize project orders when component mounts or projects change
    useEffect(() => {
        if (projects.length > 0) {
            const normalizedProjects = normalizeOrders(projects);

            // Check if orders need to be updated in the database
            const needsUpdate = normalizedProjects.some(
                (proj, idx) => proj.order !== projects[idx].order
            );

            if (needsUpdate) {
                // Update local state first
                setProjectsForm(normalizedProjects);

                // Update orders in database for each project that changed
                normalizedProjects.forEach(async (project) => {
                    const originalProject = projects.find(
                        (p) => p.id === project.id
                    );
                    if (
                        originalProject &&
                        originalProject.order !== project.order
                    ) {
                        try {
                            await updateProject(project.id, project);
                        } catch (error) {
                            toast.error(
                                `Failed to update order for project ${project.id}`
                            );
                        }
                    }
                });
            }
        }
    }, [projects, normalizeOrders, updateProject]);

    const handleDelete = async (id: number) => {
        try {
            await deleteProject(id);
        } catch (error) {
            toast.error("Failed to delete project");
        }
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

            try {
                // Get the project that was moved
                const draggedProject = projectsForm[source.index];

                // Create a new array with the item removed from source and added at destination
                const newItems = Array.from(projectsForm);
                newItems.splice(source.index, 1);
                newItems.splice(destination.index, 0, draggedProject);

                // Assign new order values (1-based, not 0-based)
                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    order: index + 1, // Start from 1
                }));

                // Update UI immediately (optimistic update)
                setProjectsForm(updatedItems);

                // Show loading state during updates
                toast.loading("Updating project order...", {
                    id: "order-update",
                });

                try {
                    // Create a deep copy of the updated items to send to the server
                    // This ensures we're not affected by any state changes during the update process
                    const itemsToUpdate = JSON.parse(
                        JSON.stringify(updatedItems)
                    );

                    // Update all projects in a single batch operation
                    const updatePromises = [];

                    for (const project of itemsToUpdate) {
                        // Create a new update promise for each project
                        updatePromises.push(
                            endpoints.projects.update(project.id, project)
                        );
                    }

                    // Wait for all updates to complete
                    const results = await Promise.all(updatePromises);

                    // Check if all updates were successful
                    const allSuccessful = results.every(
                        (result: any) =>
                            result.status >= 200 && result.status < 300
                    );

                    // Dismiss the loading toast
                    toast.dismiss("order-update");

                    if (allSuccessful) {
                        toast.success("Project order updated");
                    } else {
                        toast.error("Some project orders could not be updated");
                    }

                    // Refresh projects to ensure we have the latest data
                    fetchProjects();
                } catch (error) {
                    toast.dismiss("order-update");
                    toast.error("Failed to update project orders");
                    fetchProjects(); // Revert to original order
                }
            } catch (error) {
                toast.error("Failed to update project order");
                fetchProjects(); // Revert to original order
            }
        },
        [projectsForm, fetchProjects]
    );

    return (
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

            {/* Debug info */}
            {projectsForm.length === 0 && !isLoading ? (
                <div className="text-center text-gray-400 mb-4">
                    No projects found. Add your first project below.
                </div>
            ) : (
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
                                                    {projectsForm.map(
                                                        (project, index) => (
                                                            <Draggable
                                                                key={project.id}
                                                                draggableId={project.id.toString()}
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
                                                                                            project.photo
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
                                                                                        project.url
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-gray-400 hover:text-gray-200"
                                                                                    aria-label="View live site"
                                                                                >
                                                                                    <icons.ExternalLink className="h-5 w-5  " />
                                                                                </a>
                                                                                {project.repo_url && (
                                                                                    <a
                                                                                        href={
                                                                                            project.repo_url
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
            )}
        </div>
    );
}

export default ProjectsSection;
