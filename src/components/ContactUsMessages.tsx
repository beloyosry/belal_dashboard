import { useEffect, useState } from "react";
import { useMessages } from "../lib/messages";
import { Message } from "../types/messages.types";
import { Trash2, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function ContactUsMessages() {
    const { messages, isLoading, fetchMessages, deleteMessage } = useMessages();
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState<number[]>([]);

    // Ensure messages is always an array
    const messagesList = Array.isArray(messages) ? messages : [];

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchMessages();
            toast.success("Messages refreshed");
        } catch (error) {
            console.error("Error refreshing messages:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirmDelete === id) {
            try {
                await deleteMessage(id);
            } catch (error) {
                console.error("Error deleting message:", error);
            } finally {
                setConfirmDelete(null);
            }
        } else {
            setConfirmDelete(id);
            // Auto-reset confirmation after 3 seconds
            setTimeout(() => setConfirmDelete(null), 3000);
        }
    };

    const toggleMessageExpand = (id: number) => {
        setExpandedMessages((prev) =>
            prev.includes(id)
                ? prev.filter((messageId) => messageId !== id)
                : [...prev, id]
        );
    };

    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return "No date";

            // Try different date parsing approaches
            let date;

            // First try: Direct parsing
            date = new Date(dateString);

            // Second try: Handle specific format if first attempt failed
            if (isNaN(date.getTime()) && typeof dateString === "string") {
                // Try to extract date parts from different formats
                const isoRegex =
                    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-]\d{2}:\d{2}))?$/;
                const match = dateString.match(isoRegex);

                if (match) {
                    // If it's ISO format but not parsing correctly, try manual construction
                    const [_, year, month, day, hour, minute, second] = match;
                    date = new Date(
                        Date.UTC(
                            parseInt(year, 10),
                            parseInt(month, 10) - 1, // Month is 0-based
                            parseInt(day, 10),
                            parseInt(hour, 10),
                            parseInt(minute, 10),
                            parseInt(second, 10)
                        )
                    );
                }
            }

            // Check if date is valid after all attempts
            if (isNaN(date.getTime())) {
                return "Invalid Date";
            }

            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            return "Invalid Date";
        }
    };

    return (
        <div className="my-10">
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                        Contact Messages
                    </h1>
                    <p className="mt-2 text-sm text-gray-300 sm:text-base">
                        View and manage messages from your portfolio contact
                        form
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isLoading || refreshing}
                        className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {refreshing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="ml-2 text-gray-300">
                        Loading messages...
                    </span>
                </div>
            ) : messagesList.length === 0 ? (
                <div className="text-center py-10 border border-gray-700 rounded-lg bg-gray-800">
                    <p className="text-gray-300">No messages found</p>
                </div>
            ) : (
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-700 table-fixed">
                        <thead className="bg-gray-800">
                            <tr>
                                <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6"
                                >
                                    Name
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                                >
                                    Email
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-white w-60 md:w-80"
                                >
                                    Message
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                                >
                                    Date
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-right text-sm font-semibold text-white"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-800">
                            {messagesList.map((message: Message) => (
                                <tr key={message.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                                        {message.name}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                        {message.email}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-300 w-60 md:w-80 max-w-xs">
                                        <div className="relative">
                                            {message.message.length > 100 ? (
                                                <>
                                                    {expandedMessages.includes(
                                                        message.id
                                                    ) ? (
                                                        <div
                                                            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center"
                                                            onClick={() =>
                                                                toggleMessageExpand(
                                                                    message.id
                                                                )
                                                            }
                                                        >
                                                            <div
                                                                className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-lg z-50 overflow-auto"
                                                                style={{
                                                                    minWidth:
                                                                        "300px",
                                                                    maxWidth:
                                                                        "90vw",
                                                                    minHeight:
                                                                        "200px",
                                                                    maxHeight:
                                                                        "90vh",
                                                                }}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <div className="mb-4">
                                                                    {
                                                                        message.message
                                                                    }
                                                                </div>
                                                                <div className="flex justify-end w-full">
                                                                    <button
                                                                        onClick={() =>
                                                                            toggleMessageExpand(
                                                                                message.id
                                                                            )
                                                                        }
                                                                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                                                    >
                                                                        Close
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    <div className="line-clamp-2">
                                                        {message.message}
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            toggleMessageExpand(
                                                                message.id
                                                            )
                                                        }
                                                        className="mt-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                                                    >
                                                        Show more
                                                    </button>
                                                </>
                                            ) : (
                                                message.message
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                        {formatDate(message.createdAt)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium w-24">
                                        <button
                                            onClick={() =>
                                                handleDelete(message.id)
                                            }
                                            className={`inline-flex items-center px-3 py-1.5 rounded border ${
                                                confirmDelete === message.id
                                                    ? "bg-red-900 text-white border-red-700"
                                                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                                            }`}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            <span>
                                                {confirmDelete === message.id
                                                    ? "Confirm"
                                                    : "Delete"}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ContactUsMessages;
