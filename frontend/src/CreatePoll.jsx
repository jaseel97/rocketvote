import { useState } from "react";

const CreatePoll = () => {
    const[description, setdescription] = useState("");
    const [options, setOptions] = useState([""]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const pollDetails = {description, options};
        console.log(pollDetails);
    };
    
    const handleReset = () => {
        setdescription("");
        setOptions([""]);
    };

    const addOption = () => {
        setOptions([...options, ""]);
    };

    const deleteOption = (index) => {
        const updatedOptions = options.filter((_, i) => i !== index);
        setOptions(updatedOptions);
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...options];
        updatedOptions[index] = value;
        setOptions(updatedOptions);
    };
    
    return(
        <div className="max-w-7xl w-full m-auto">
        <div className="flex flex-row mt-5 border-2 rounded-sm p-12">
            <div className="w-full text-start">
                <h2 className="text-xl font-bold">Choose Poll Template</h2>
            </div>
            <div className="w-full text-start">
                <h2 className="text-xl font-bold">Create Custom Poll</h2>
                <form onSubmit={handleSubmit}>
                    <label className="font-semibold">Description/Question</label> 
                    <textarea
                        required
                        value={description}
                        onChange={(e) => setdescription(e.target.value)}
                                            className="w-4/5 py-[6px] px-[10px] my-[10px] box-border border border-gray-300 block resize-none" placeholder="Description / Question for the Poll"
                                            ></textarea>
                    <label className="font-semibold">Options</label> 
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
                                onClick={() => deleteOption(index)}
                                disabled={options.length === 1} 
                            >
                                Delete
                            </button>
                            <button
                        type="button"
                        className="w-20 block bg-green-500 text-white p-1 rounded-md cursor-pointer hover:bg-green-600"
                        onClick={addOption}
                    >
                        Add
                    </button>
                        </div>
                    ))}
                    <div className="flex flex-row justify-start">
                    <button className="w-24 mr-10 block bg-blue-500 text-white p-1 rounded-md cursor-pointer hover:bg-blue-600">
                        Create Poll
                        </button>
                    <button className="w-24 block bg-blue-500 text-white p-1 rounded-md cursor-pointer hover:bg-blue-600"onClick={(e) => handleReset()}>
                        Reset
                        </button>
                    </div>
                    </form>
            </div>
        </div>
        </div>
    );
}
 
export default CreatePoll;