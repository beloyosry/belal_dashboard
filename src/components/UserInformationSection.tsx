import { useEffect, useState } from "react";
import { User } from "../types";
import * as LucideIcons from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "react-hot-toast";
const icons = {
    ...LucideIcons,
};

function UserInformationSection() {
    const { user, fetchProfile, updateProfile, profileLoading } = useAuth();
    const [userForm, setUserForm] = useState<User | null>(null);
    const [userFormModified, setUserFormModified] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleUserChange = (field: string, value: unknown) => {
        if (userForm) {
            setUserForm({ ...userForm, [field]: value });
            setUserFormModified(true);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (user) {
            setUserForm(user);
        }
    }, [user]);

    const handleUserSubmit = async () => {
        if (!userForm) return;

        try {
            await updateProfile(userForm);
            setUserFormModified(false);
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    return (
        <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
                <div className="flex flex-col items-center">
                    {/* Profile Image */}
                    <div className="relative mb-6 group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg">
                            {editingField === "photo" ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
                                    <input
                                        type="text"
                                        className="w-48 px-2 py-1 text-sm bg-gray-700 border border-indigo-400 rounded text-white"
                                        value={userForm?.photo || ""}
                                        onChange={(e) =>
                                            handleUserChange(
                                                "photo",
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
                                    src={userForm?.photo || user?.photo}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <button
                                className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setEditingField("photo")}
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
                                    handleUserChange("email", e.target.value)
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
                                {userForm?.email ||
                                    user?.email ||
                                    "Add your email"}
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
                                    href={
                                        userForm?.github || user?.github || "#"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                    onClick={(e) => {
                                        if (
                                            !(userForm?.github || user?.github)
                                        ) {
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
                                    href={
                                        userForm?.linkedin ||
                                        user?.linkedin ||
                                        "#"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                    onClick={(e) => {
                                        if (
                                            !(
                                                userForm?.linkedin ||
                                                user?.linkedin
                                            )
                                        ) {
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
                            disabled={profileLoading}
                            className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {profileLoading ? (
                                <>
                                    <icons.Loader className="animate-spin mr-2 h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserInformationSection;
