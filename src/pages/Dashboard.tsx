import { useState } from "react";
import { Project } from "../types";
import ProjectsSection from "../components/ProjectsSection";
import SkillsSection from "../components/SkillsSection";
import UserInformationSection from "../components/UserInformationSection";
import ProjectForm from "../components/ProjectForm";
import CVEditor from "../components/CVEditor";
import ContactUsMessages from "../components/ContactUsMessages";

export default function Dashboard() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    return (
        <div className="bg-gray-900 h-auto overflow-y-auto overflow-hidden p-6 sm:p-8 md:p-10 lg:p-12">
            {/* User Information Section */}
            <UserInformationSection />

            {/* CV Management Section */}
            <div className="mt-8 max-w-3xl mx-auto">
                <CVEditor />
            </div>

            {/* Skills Section */}
            <SkillsSection />

            {/* Projects Section */}
            <ProjectsSection
                setIsFormOpen={setIsFormOpen}
                setEditingProject={setEditingProject}
            />

            {/* Contact Messages Section */}
            <ContactUsMessages />

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
                    }}
                />
            )}
        </div>
    );
}
