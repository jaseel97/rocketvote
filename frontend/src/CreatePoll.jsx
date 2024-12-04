import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useFetch from "./useFetch";
import { useTheme } from './ThemeContext';
import { useAuth } from './context/AuthContext';

import { StyledToggle } from './StyledToggle'

import {
    PlusCircleIcon as PlusCircleOutline,
    TrashIcon as TrashOutline,
    XMarkIcon as XMarkOutline,
} from '@heroicons/react/24/outline';

import {
    appDomain,
    apiDomain,
    wsDomain
} from "./Config"

const CreatePoll = () => {
    const { isAuthenticated, redirectToLogin } = useAuth();

    useEffect(() => {
        if (isAuthenticated === false) {
            redirectToLogin();
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return <div>Redirecting to login...</div>;
    if (!isAuthenticated) return null;

    const { darkMode } = useTheme();
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [activeTemplate, setActiveTemplate] = useState("");
    const [multiSelection, setMultiSelection] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [templateTitle, setTemplateTitle] = useState("");
    const [triggerFetch, setTriggerFetch] = useState(0);
    const [validationError, setValidationError] = useState("");
    const [anonymous, setAnonymous] = useState(false);
    const navigate = useNavigate();

    const { data: templates, isPending, error } = useFetch(`${apiDomain}/templates?_${triggerFetch}`);

    const validateOptions = () => {
        const hasEmptyOptions = options.some(option => !option.trim());
        if (hasEmptyOptions) {
            setValidationError("All options must contain at least one character.");
            return false;
        }

        const normalizedOptions = options.map(opt => opt.trim().toLowerCase());
        const uniqueOptions = new Set(normalizedOptions);
        if (uniqueOptions.size !== normalizedOptions.length) {
            setValidationError("All options must be unique.");
            return false;
        }

        setValidationError("");
        return true;
    };

    const handleSaveTemplate = () => {
        if (!templateTitle.trim()) {
            setValidationError("Template title is required.");
            return;
        }

        if (!validateOptions()) {
            return;
        }

        fetch(`${apiDomain}/templates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: templateTitle,
                description,
                options,
                revealed: 0,
                multi_selection: multiSelection ? 1 : 0,
                anonymous
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to save template");
                return res.json();
            })
            .then(() => {
                setTriggerFetch(prev => prev + 1);
                setValidationError(""); // Clear any existing validation errors
            })
            .catch((err) => {
                console.error("Error:", err);
                setValidationError("Failed to save template. Please try again.");
            });
    };

    const handleDeleteTemplate = (templateTitle) => {
        // console.log(JSON.stringify({
        //     "title": templateTitle
        // }));

        fetch(`${apiDomain}/templates`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "title": templateTitle
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to delete template");
                if (activeTemplate === templateTitle) {
                    handleReset();
                }

                setTriggerFetch(prev => prev + 1);
            })
            .catch((err) => console.error("Error:", err));
    };

    const buttonStyle = {
        add: {
            icon: <PlusCircleOutline className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />,
            className: "ml-2 p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 group transition-colors"
        },
        delete: {
            icon: <TrashOutline className="w-6 h-6 group-hover:scale-110 group-hover:animate-wiggle transition-transform duration-300" />,
            className: "ml-2 p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateOptions()) {
            return;
        }

        const pollDetails = {
            description,
            type: activeTemplate || "custom",
            options,
            revealed: 0,
            multi_selection: multiSelection ? 1 : 0,
            anonymous: anonymous ? 1 : 0,
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
                if (responseData.poll_id) {
                    window.open(`${appDomain}/${responseData.poll_id}`, "_blank");
                }
                if (responseData.redirect_url) {
                    navigate(responseData.redirect_url, {
                        state: { redirect_url: responseData.redirect_url, poll_id: responseData.poll_id },
                    });
                }
                setValidationError("");
            })
            .catch((err) => {
                console.error("Error:", err);
                setValidationError("Failed to create poll. Please try again.");
            });
    };

    const handleReset = () => {
        setDescription("");
        setOptions(["", "", "", ""]);
        setActiveTemplate("");
        setMultiSelection(false);
        setAnonymous(false);
        setTemplateTitle("");
    };
    const handleAddOption = (index) => {
        const updatedOptions = [...options];
        updatedOptions.splice(index + 1, 0, "");
        setOptions(updatedOptions);
    };

    const handleDeleteOption = (index) => {
        if (options.length > 1) {
            setOptions(options.filter((_, i) => i !== index));
        }
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
        setTemplateTitle(template.type);
        setAnonymous(template.anonymous)
    };

    const filteredTemplates = templates
        ? Object.values(templates).filter((template) =>
            template.type.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];


    const inputClasses = `
        block px-2.5 pb-2.5 pt-4 w-full text-sm 
        text-gray-900 dark:text-white 
        bg-gray-100 dark:bg-gray-600 
        border-0 border-b-2 border-gray-300 dark:border-gray-500
        rounded-t-lg 
        appearance-none 
        focus:outline-none 
        focus:border-red-500 dark:focus:border-red-400 
        focus:bg-gray-50 dark:focus:bg-gray-700
        hover:border-red-500 dark:hover:border-red-400 
        hover:bg-gray-50 dark:hover:bg-gray-700
        not-placeholder-shown:bg-gray-50 dark:not-placeholder-shown:bg-gray-700
        not-placeholder-shown:border-red-500 dark:not-placeholder-shown:border-red-400
        peer 
        transition-all duration-300
    `;


    const labelClasses = `
        absolute text-sm 
        text-gray-500 dark:text-gray-400 
        duration-300 transform 
        -translate-y-4 scale-75 top-2 
        z-10 origin-[0] 
        bg-transparent
        px-2 
        peer-focus:px-2 
        peer-hover:px-2
        peer-placeholder-shown:scale-100 
        peer-placeholder-shown:-translate-y-1/2 
        peer-placeholder-shown:top-1/2 
        peer-focus:top-2 
        peer-hover:top-2
        peer-focus:scale-75 
        peer-hover:scale-75
        peer-focus:-translate-y-4 
        peer-hover:-translate-y-4
        peer-focus:text-red-500 dark:peer-focus:text-red-400
        peer-hover:text-red-500 dark:peer-hover:text-red-400
        peer-[&:not(:placeholder-shown)]:text-red-500 dark:peer-[&:not(:placeholder-shown)]:text-red-400
        peer-focus:font-medium
        peer-hover:font-medium
        peer-[&:not(:placeholder-shown)]:font-medium
        left-1
    `;

    const textareaLabelClasses = `
        absolute text-sm 
        text-gray-500 dark:text-gray-400 
        duration-300 transform 
        -translate-y-4 scale-75 top-2 
        z-10 origin-[0] 
        bg-transparent
        px-2 
        peer-focus:px-2 
        peer-hover:px-2
        peer-placeholder-shown:scale-100 
        peer-placeholder-shown:-translate-y-1/2 
        peer-placeholder-shown:top-6 
        peer-focus:top-2 
        peer-hover:top-2
        peer-focus:scale-75 
        peer-hover:scale-75
        peer-focus:-translate-y-4 
        peer-hover:-translate-y-4
        peer-focus:text-red-500 dark:peer-focus:text-red-400
        peer-hover:text-red-500 dark:peer-hover:text-red-400
        peer-[&:not(:placeholder-shown)]:text-red-500 dark:peer-[&:not(:placeholder-shown)]:text-red-400
        peer-focus:font-medium
        peer-hover:font-medium
        peer-[&:not(:placeholder-shown)]:font-medium
        left-1
    `;
    const addDeleteButtons = `
    ml-2 p-3 rounded-2xl
    bg-gradient-to-br
    text-gray-600 dark:text-gray-400
    border
    shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
    dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
    hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9)]
    dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1)]
    group transition-all duration-300 ease-in-out
`;

    const endButtons = `
    px-8 py-3 rounded-2xl 
    relative overflow-hidden
    bg-gradient-to-r from-gray-50 to-gray-100
    dark:from-gray-800 dark:to-gray-750
    font-medium
    border-2
    before:absolute before:inset-0
    before:bg-gradient-to-r
    before:translate-x-[-200%]
    hover:before:translate-x-[200%]
    before:transition-transform before:duration-1000
    transition-all duration-300 ease-in-out
`;


    const deleteIconButton = `
        absolute -top-3 -right-3 z-20 
        p-1.5 rounded-full
        bg-gradient-to-r from-white to-red-50
        dark:from-gray-800 dark:to-red-900/20
        text-gray-500 dark:text-gray-400
        border border-red-200/50 dark:border-red-500/20
        shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
        dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
        hover:text-red-600 dark:hover:text-red-600
        hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9)]
        dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1)]
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
        dark:disabled:hover:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
        disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400
        group transition-all duration-300
    `;

    return (
        <div className="min-h-screen max-h-full w-full bg-[#ECEFF1] dark:bg-gray-900 flex justify-center p-4">
            <div className="w-full bg-[#CFD8DC] dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12">
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Poll Templates</h2>

                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder=" "
                                className={inputClasses}
                            />
                            <label
                                htmlFor="search"
                                className={labelClasses}
                            >
                                Search templates
                            </label>
                        </div>

                        {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
                        {isPending && <p className="text-gray-600 dark:text-gray-300">Loading templates...</p>}
                        <div className="grid gap-4 mt-4 grid-cols-3">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.type}
                                    className="group relative"
                                >

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(template.type);
                                        }}
                                        className={deleteIconButton}
                                    >
                                        <XMarkOutline className="w-4 h-4 group-hover:scale-110 group-hover:animate-wiggle transition-transform duration-300" />
                                    </button>

                                    <div
                                        onClick={() => handleTemplateSelection(template)}
                                        className={`
                            w-full h-20 
                            cursor-pointer 
                            text-center 
                            rounded-2xl
                            bg-gradient-to-r from-gray-50 to-gray-100
                            dark:from-gray-800 dark:to-gray-750
                            border-2
                            overflow-hidden
                            transition-all duration-300 ease-in-out
                            relative
                            ${activeTemplate === template.type
                                                ? `text-zinc-700 dark:text-zinc-300
                                       border-zinc-500/50 dark:border-zinc-400/50
                                       shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(113,113,122,0.3)]
                                       dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(161,161,170,0.3)]
                                       scale-[1.02]`
                                                : `text-zinc-600 dark:text-zinc-400
                                       border-zinc-500/30 dark:border-zinc-400/30
                                       shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(113,113,122,0.2)]
                                       dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(161,161,170,0.2)]
                                       hover:border-zinc-500/50 dark:hover:border-zinc-400/50
                                       hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(113,113,122,0.3)]
                                       dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(161,161,170,0.3)]
                                       hover:text-zinc-700 dark:hover:text-zinc-300`
                                            }
                        `}
                                    >
                                        <div className="absolute inset-0 
                                      bg-gradient-to-r from-transparent via-white to-transparent 
                                      dark:via-white/10
                                      opacity-0 group-hover:opacity-100
                                      -translate-x-full group-hover:translate-x-full
                                      transition-all duration-1000"
                                        ></div>

                                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                                            <p className="font-medium tracking-wide">{template.type}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Poll</h2>

                        {validationError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-red-600 dark:text-red-400 text-sm">{validationError}</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            {/* Template Title */}
                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    id="template-title"
                                    value={templateTitle}
                                    onChange={(e) => setTemplateTitle(e.target.value)}
                                    placeholder=" "
                                    className={inputClasses}
                                />
                                <label
                                    htmlFor="template-title"
                                    className={labelClasses}
                                >
                                    Template Title
                                </label>
                            </div>

                            <div className="relative mb-6">
                                <textarea
                                    required
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder=" "
                                    rows="3"
                                    className={`${inputClasses} resize-none`}
                                ></textarea>
                                <label
                                    htmlFor="description"
                                    className={textareaLabelClasses}
                                >
                                    Description/Question
                                </label>
                            </div>

                            <label className="block font-semibold mb-4 text-gray-900 dark:text-white">Options</label>
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center mb-4">
                                    <div className="relative flex-grow">
                                        <textarea
                                            id={`option-${index}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder=" "
                                            className={`${inputClasses} h-12 resize-none`}
                                        ></textarea>
                                        <label
                                            htmlFor={`option-${index}`}
                                            className={textareaLabelClasses}
                                        >
                                            Option {index + 1}
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        className={`${addDeleteButtons}
             from-white to-green-50
             dark:from-gray-800 dark:to-green-900/20
             border-green-200/50 dark:border-green-500/20
             hover:text-green-600 dark:hover:text-green-400`}
                                        onClick={() => handleAddOption(index)}
                                    >
                                        <PlusCircleOutline className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${addDeleteButtons}
             from-white to-red-50
             dark:from-gray-800 dark:to-red-900/20
             border-red-200/50 dark:border-red-500/20
             hover:text-red-600 dark:hover:text-red-400
             disabled:opacity-50 disabled:cursor-not-allowed
             disabled:hover:shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
             dark:disabled:hover:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
             disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400`}
                                        onClick={() => handleDeleteOption(index)}
                                        disabled={options.length === 1}
                                    >
                                        <TrashOutline className="w-6 h-6 group-hover:scale-110 group-hover:animate-wiggle transition-transform duration-300" />
                                    </button>
                                </div>
                            ))}

                            {/* <div className="relative mb-6 mt-6">
                                <div className={`block px-2.5 pb-2.5 pt-4 w-full text-sm 
                                            text-gray-900 dark:text-white 
                                            bg-gray-100 dark:bg-gray-600 
                                            border-0 border-b-2 
                                            ${multiSelection
                                        ? "border-red-500 dark:border-red-400"
                                        : "border-gray-300 dark:border-gray-500"}
                                            rounded-t-lg 
                                            hover:border-red-500 dark:hover:border-red-400 
                                            hover:bg-gray-50 dark:hover:bg-gray-700
                                            transition-all duration-300
                                            group`}>
                                    <div className="flex items-center">
                                        <input
                                            id="multi-selection-checkbox"
                                            type="checkbox"
                                            checked={multiSelection}
                                            onChange={(e) => setMultiSelection(e.target.checked)}
                                            onBlur={(e) => e.target.parentElement.parentElement.classList.remove('focused')}
                                            onFocus={(e) => e.target.parentElement.parentElement.classList.add('focused')}
                                            className="w-5 h-5 cursor-pointer 
                                                    accent-red-500
                                                    bg-transparent
                                                    border-gray-400 dark:border-gray-500
                                                    focus:ring-red-500 dark:focus:ring-red-400
                                                    focus:ring-offset-gray-50 dark:focus:ring-offset-gray-700
                                                    transition-colors duration-300"
                                        />
                                        <label
                                            htmlFor="multi-selection-checkbox"
                                            className={`w-full ms-2 text-sm font-medium 
                                                    cursor-pointer
                                                    ${multiSelection
                                                    ? "text-red-500 dark:text-red-400"
                                                    : "text-gray-900 dark:text-white"}
                                                    group-hover:text-red-500 dark:group-hover:text-red-400
                                                    transition-colors duration-300`}
                                        >
                                            Allow Multiple Selections
                                        </label>
                                    </div>
                                </div>
                                <style jsx="true">{`
                                    .focused {
                                        border-color: rgb(239 68 68) !important;
                                        background-color: rgb(249 250 251) !important;
                                    }
                                    .dark .focused {
                                        border-color: rgb(248 113 113) !important;
                                        background-color: rgb(55 65 81) !important;
                                    }
                                `}</style>
                            </div> */}
                            {/* <div className="relative mb-6 mt-6 space-y-4">
                                <div className={`block px-2.5 pb-2.5 pt-4 w-full text-sm 
        text-gray-900 dark:text-white 
        bg-gray-100 dark:bg-gray-600 
        border-0 border-b-2 
        ${multiSelection
                                        ? "border-red-500 dark:border-red-400"
                                        : "border-gray-300 dark:border-gray-500"}
        rounded-t-lg 
        hover:border-red-500 dark:hover:border-red-400 
        hover:bg-gray-50 dark:hover:bg-gray-700
        transition-all duration-300
        group`}>
                                    <StyledToggle
                                        isChecked={multiSelection}
                                        onChange={setMultiSelection}
                                        label="Allow Multiple Selections"
                                    />
                                </div>

                                <div className={`block px-2.5 pb-2.5 pt-4 w-full text-sm 
        text-gray-900 dark:text-white 
        bg-gray-100 dark:bg-gray-600 
        border-0 border-b-2 
        ${anonymous
                                        ? "border-red-500 dark:border-red-400"
                                        : "border-gray-300 dark:border-gray-500"}
        rounded-t-lg 
        hover:border-red-500 dark:hover:border-red-400 
        hover:bg-gray-50 dark:hover:bg-gray-700
        transition-all duration-300
        group`}>
                                    <StyledToggle
                                        isChecked={anonymous}
                                        onChange={setAnonymous}
                                        label="Anonymous Poll"
                                    />
                                </div>
                            </div> */}
                            <div className="flex gap-6 items-center">
                                <StyledToggle
                                    isChecked={multiSelection}
                                    onChange={setMultiSelection}
                                    label="Allow Multiple Selections"
                                />
                                <StyledToggle
                                    isChecked={anonymous}
                                    onChange={setAnonymous}
                                    label="Anonymous Poll"
                                />
                            </div>

                            <div className="mt-6 flex gap-4">
                                <button
                                    type="submit"
                                    className={`${endButtons}
             text-green-500 dark:text-green-400
             border-green-500/30 dark:border-green-400/30
             shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(34,197,94,0.2)]
             dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(74,222,128,0.2)]
             before:from-green-500/0 before:via-green-500/10 before:to-green-500/0
             hover:border-green-500/50 dark:hover:border-green-400/50
             hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(34,197,94,0.3)]
             dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(74,222,128,0.3)]`}
                                >
                                    <span className="relative z-10">
                                        Create Poll
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className={`${endButtons}
             text-red-500 dark:text-red-400
             border-red-500/30 dark:border-red-400/30
             shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(239,68,68,0.2)]
             dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(248,113,113,0.2)]
             before:from-red-500/0 before:via-red-500/10 before:to-red-500/0
             hover:border-red-500/50 dark:hover:border-red-400/50
             hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(239,68,68,0.3)]
             dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(248,113,113,0.3)]`}
                                >
                                    <span className="relative z-10">
                                        Reset
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveTemplate}
                                    className={`${endButtons}
             text-sky-500 dark:text-sky-400
             border-sky-500/30 dark:border-sky-400/30
             shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(14,165,233,0.2)]
             dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(56,189,248,0.2)]
             before:from-sky-500/0 before:via-blue-500/10 before:to-sky-500/0
             hover:border-sky-500/50 dark:hover:border-sky-400/50
             hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(14,165,233,0.3)]
             dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(56,189,248,0.3)]`}
                                >
                                    <span className="relative z-10">Save Template</span>
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