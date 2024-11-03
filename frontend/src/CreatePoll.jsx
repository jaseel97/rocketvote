import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "./useFetch";

const apiDomain="http://rocketvote.com/api"

const CreatePoll = () => {
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState([""]);
    const [activeTemplate, setActiveTemplate] = useState("");
    const [multiSelection, setMultiSelection] = useState(false);
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
                    state: { redirect_url: responseData.redirect_url, poll_id: responseData.poll_id } 
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
        setOptions(template.options);
        setActiveTemplate(template.type);
        setMultiSelection(template.multi_selection === 1);
    };

    return (
        <div className="min-h-screen w-full bg-gray-800 flex items-center justify-center p-4"> {/* Darker outer background */}
            <div className="w-full max-w-4xl bg-gray-200 rounded-lg shadow-md p-8 md:p-12 transition-transform transform hover:scale-95"> {/* Lighter inner background with zoom-out effect */}
                <div className="flex flex-col md:flex-row">
                    {/* Template Section */}
                    <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
                        <h2 className="text-2xl font-bold text-[#910d22] mb-4">Poll Templates</h2>
                        {error && <p className="text-red-500">{error}</p>}
                        {isPending && <p>Loading templates...</p>}
                        <div className="flex flex-wrap">
                            {templates && Object.values(templates).map((template) => (
                                <div
                                    key={template.type}
                                    onClick={() => handleTemplateSelection(template)}
                                    className={`border w-full sm:w-1/2 md:w-1/3 h-20 cursor-pointer mr-4 mb-4 text-center rounded-lg transition-all transform ${
                                        activeTemplate === template.type
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
                                className="w-full p-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#910d22] transition-all"
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
                                        className="w-2/3 h-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#910d22] transition-all"
                                        placeholder={`Option ${index + 1}`}
                                    ></textarea>
                                    <button
                                        type="button"
                                        className="ml-2 bg-[#910d22] text-white px-4 py-1 rounded-md hover:bg-[#b5162b] transition-all"
                                        onClick={() => handleDeleteOption(index)}
                                        disabled={options.length === 1}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="ml-2 bg-gray-600 text-white px-4 py-1 rounded-md hover:bg-gray-700 transition-all"
                                        onClick={() => handleAddOption(index)}
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}

                            <div className="mt-6 flex">
                                <button 
                                    className="mr-4 bg-[#910d22] text-white px-6 py-2 rounded-md hover:bg-[#b5162b] transition-all"
                                >
                                    Create Poll
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-all"
                                    onClick={handleReset}
                                >
                                    Reset
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
