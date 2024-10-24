import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from './useFetch'; 
const CreatePoll = () => {
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState([""]);
    const [activeTemplate, setActiveTemplate] = useState("");
    const [multiSelection, setMultiSelection] = useState(false);
    const navigate = useNavigate(); 

    const { data: templates, isPending, error } = useFetch("http://localhost:8080/templates");

    const handleSubmit = (e) => {
        e.preventDefault();

        const pollDetails = {
            description: description,
            type: activeTemplate || "custom",
            options: options,
            revealed: 0,
            multi_selection: multiSelection ? 1 : 0,
        };

        fetch("http://localhost:8080/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pollDetails),
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error('Failed to create poll');
            }
            return res.json();
        })
        .then((responseData) => {
            console.log("Poll Created:", responseData);
            if (responseData.poll_id) {
                const voteUrl = `http://localhost:5173/${responseData.poll_id}`;
                window.open(voteUrl, '_blank');
            }
            if (responseData.redirect_url) {
                navigate(responseData.redirect_url, { 
                    state: { 
                      redirect_url: responseData.redirect_url, 
                      poll_id: responseData.poll_id 
                    } 
                  });
            }
        })
        .catch((err) => {
            console.error("Error:", err);
        });
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
        <div className="max-w-7xl w-full m-auto bg-gray-100">
            <div className="flex flex-row mt-5 border-2 rounded-sm p-12 max-h-full">
                <div className="w-full text-start">
                    <h2 className="text-xl font-bold mb-8">Poll Templates</h2>
                    {error && <p className="text-red-500">{error}</p>}
                    {isPending && <p>Loading templates...</p>}
                    <div id="templates" className="flex flex-wrap">
                        {templates && Object.values(templates).map((template) => (
                            <div
                                key={template.type}
                                onClick={() => handleTemplateSelection(template)}
                                className={`border-2 w-1/4 h-20 cursor-pointer mr-6 mb-6 ${
                                    activeTemplate === template.type
                                        ? "bg-gray-400"
                                        : "bg-gray-200 hover:bg-gray-400"
                                }`}
                            >
                                <p className="m-auto text-center pt-6">{template.type}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full text-start">
                    <h2 className="text-xl font-bold mb-8">Poll</h2>
                    <form onSubmit={handleSubmit}>
                        <label className="font-semibold">Description/Question</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-4/5 p-2 box-border border border-gray-300 block resize-none mb-6"
                            placeholder="Description / Question for the Poll"
                        ></textarea>
                        
                        <div className="my-4">
                            <input
                                type="checkbox"
                                checked={multiSelection}
                                onChange={(e) => setMultiSelection(e.target.checked)}
                            />
                            <label className="ml-2 font-semibold">Allow Multiple Selections</label>
                        </div>

                        <label className="font-semibold my-10">Options</label>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center my-2">
                                <textarea
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    className="w-1/2 h-10 py-[6px] px-[10px] box-border border border-gray-300 resize-none"
                                    placeholder={`Option ${index + 1}`}
                                ></textarea>
                                <button
                                    type="button"
                                    className="ml-4 w-20 mr-4 bg-red-500 text-white p-1 rounded-md cursor-pointer hover:bg-red-600"
                                    onClick={() => handleDeleteOption(index)}
                                    disabled={options.length === 1}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="w-20 block bg-green-500 text-white p-1 rounded-md cursor-pointer hover:bg-green-600"
                                    onClick={() => handleAddOption(index)}
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                        <div className="flex flex-row justify-start">
                            <button className="w-24 mr-10 block bg-blue-500 text-white p-1 rounded-md cursor-pointer hover:bg-blue-600">
                                Create Poll
                            </button>
                            <button
                                type="button"
                                className="w-24 block bg-blue-500 text-white p-1 rounded-md cursor-pointer hover:bg-blue-600"
                                onClick={handleReset}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePoll;
