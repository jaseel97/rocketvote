import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "./useFetch";

const apiDomain = "http://rocketvote.com/api";

const CreatePoll = () => {
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState([""]);
    const [activeTemplate, setActiveTemplate] = useState("");
    const [multiSelection, setMultiSelection] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // New state for search term
    const [templateTitle, setTemplateTitle] = useState("");
    const navigate = useNavigate();
    const { data: templates, isPending, error } = useFetch(`${apiDomain}/templates`);

    const handleSubmit = (e) => {
        e.preventDefault();

        const pollDetails = {
            description,
            type: activeTemplate || "custom",
            options,
            revealed: 0,
            multi_selection: multiSelection ? 1 : 0,
        };

        fetch(`${apiDomain}/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pollDetails),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to create poll");
                return res.json();
            })
            .then((responseData) => {
                console.log("Poll Created:", responseData);
                if (responseData.poll_id) {
                    const voteUrl = `http://rocketvote.com/${responseData.poll_id}`;
                    window.open(voteUrl, "_blank");
                }
                if (responseData.redirect_url) {
                    navigate(responseData.redirect_url, {
                        state: { redirect_url: responseData.redirect_url, poll_id: responseData.poll_id },
                    });
                }
            })
            .catch((err) => console.error("Error:", err));
    };

    const handleReset = () => {
        setDescription("");
        setOptions([""]);
        setActiveTemplate("");
        setMultiSelection(false);
    };

    const handleAddOption = (index) => {
        const updatedOptions = [...options];
        updatedOptions.splice(index + 1, 0, "");
        setOptions(updatedOptions);
    };

    const handleDeleteOption = (index) => {
        const updatedOptions = options.filter((_, i) => i !== index);
        setOptions(updatedOptions);
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...options];
        updatedOptions[index] = value;
        setOptions(updatedOptions);
    };

    const handleTemplateSelection = (template) => {
        setDescription(template.description || "");
        setOptions(template.options);
        setActiveTemplate(template.type);
        setMultiSelection(template.multi_selection === 1);
        setTemplateTitle(template.type); // Set the title to the template's type
    };


    const handleSaveTemplate = () => {
        if (!templateTitle.trim()) {
            alert("Title cannot be empty.");
            return;
        }

        const templateData = {
            type: templateTitle,
            description,
            options,
            revealed: 0,
            multi_selection: multiSelection ? 1 : 0,
        };

        fetch(`${apiDomain}/templates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateData),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to save template");
                return res.json();
            })
            .then((responseData) => {
                console.log("Template Saved:", responseData);
                alert("Template saved successfully.");
            })
            .catch((err) => console.error("Error:", err));
    };

    const filteredTemplates = templates
        ? Object.values(templates).filter((template) =>
            template.type.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];

    return (
        <div className="min-h-screen w-full bg-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-gray-200 rounded-lg shadow-md p-8 md:p-12">
                <div className="flex flex-col md:flex-row">
                    {/* Template Section */}
                    <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
                        <h2 className="text-2xl font-bold text-[#910d22] mb-4">Poll Templates</h2>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search templates"
                            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#910d22]"
                        />
                        {error && <p className="text-red-500">{error}</p>}
                        {isPending && <p>Loading templates...</p>}
                        <div className={`grid gap-4 ${filteredTemplates.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}>
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.type}
                                    onClick={() => handleTemplateSelection(template)}
                                    className={`border w-full h-20 cursor-pointer text-center rounded-lg transition-all transform ${activeTemplate === template.type
                                        ? "bg-[#910d22] text-white scale-105"
                                        : "bg-gray-300 hover:bg-[#910d22] hover:text-white"
                                        }`}
                                >
                                    <p className="pt-6">{template.type}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Poll Form Section */}
                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-bold text-[#910d22] mb-4">Create a Poll</h2>
                        <form onSubmit={handleSubmit}>
                            <label className="block font-semibold mb-2">Description/Question</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#910d22]"
                                placeholder="Enter your poll question"
                            ></textarea>

                            <div className="mb-6">
                                <input
                                    type="checkbox"
                                    checked={multiSelection}
                                    onChange={(e) => setMultiSelection(e.target.checked)}
                                    className="mr-2 cursor-pointer"
                                />
                                <label className="font-semibold">Allow Multiple Selections</label>
                            </div>

                            <label className="block font-semibold mb-4">Options</label>
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center mb-4">
                                    <textarea
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="w-2/3 h-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#910d22]"
                                        placeholder={`Option ${index + 1}`}
                                    ></textarea>
                                    <button
                                        type="button"
                                        className="ml-2 bg-[#910d22] text-white px-4 py-1 rounded-md"
                                        onClick={() => handleDeleteOption(index)}
                                        disabled={options.length === 1}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="ml-2 bg-gray-600 text-white px-4 py-1 rounded-md"
                                        onClick={() => handleAddOption(index)}
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}

                            {/* Template Title Input */}
                            <label className="block font-semibold mt-6">Template Title</label>
                            <input
                                type="text"
                                value={templateTitle}
                                onChange={(e) => setTemplateTitle(e.target.value)}
                                className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#910d22]"
                                placeholder="Enter template title"
                            />

                            {/* Buttons Section */}
                            <div className="mt-6 flex gap-4">
                                <button
                                    type="submit"
                                    className="bg-[#910d22] text-white px-6 py-2 rounded-md"
                                >
                                    Create Poll
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-500 text-white px-6 py-2 rounded-md"
                                    onClick={handleReset}
                                >
                                    Reset
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveTemplate}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-md"
                                >
                                    Save Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePoll;

