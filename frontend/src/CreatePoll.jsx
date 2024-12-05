import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useFetch from "./useFetch";
import { useTheme } from './ThemeContext';
import { useAuth } from './context/AuthContext';

import { StyledToggle } from './StyledToggle'

import { useAccessibility } from './AccessibilityContext';
import {
    PlusCircleIcon as PlusCircleOutline,
    TrashIcon as TrashOutline,
    XMarkIcon as XMarkOutline,
} from '@heroicons/react/24/outline';
import {
    appDomain,
    apiDomain,
} from "./Config";

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
    const { settings } = useAccessibility();

    const isAtMaxOptions = options.length >= 15;
    const isAtMinOptions = options.length <= 2;

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

        if (!validateOptions()) return;

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
                setValidationError("");
            })
            .catch((err) => {
                console.error("Error:", err);
                setValidationError("Failed to save template. Please try again.");
            });
    };

    const handleDeleteTemplate = (templateTitle) => {
        fetch(`${apiDomain}/templates`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: templateTitle }),
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateOptions()) return;

        fetch(`${apiDomain}/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description,
                type: activeTemplate || "custom",
                options,
                revealed: 0,
                multi_selection: multiSelection ? 1 : 0,
                anonymous: anonymous ? 1 : 0
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to create poll");
                return res.json();
            })
            .then((responseData) => {
                if (responseData.redirect_url) {
                    navigate(`/create/${responseData.poll_id}`, {
                        state: {
                            poll_id: responseData.poll_id,
                            redirect_url: responseData.redirect_url
                        }
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
        if (isAtMaxOptions) {
            setValidationError("Maximum 15 options are allowed.");
            return;
        }
        const updatedOptions = [...options];
        updatedOptions.splice(index + 1, 0, "");
        setOptions(updatedOptions);
    };


    const handleDeleteOption = (index) => {
        if (isAtMinOptions) {
            setValidationError("Minimum 2 options are required.");
            return;
        }
        setOptions(options.filter((_, i) => i !== index));
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
        )
        : [];

    return (
        <div className={`
        min-h-screen max-w-full bg-[#ECEFF1] dark:bg-gray-900 flex justify-center p-4
        ${settings.fontSize}
        ${settings.fontFamily}
        ${settings.fontStyle}
        `}>
            <div className="w-full bg-[#DEE4E7] dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12">
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
                        <h2 className={`${settings.fontSize === 'text-lg' ? 'text-4xl' : settings.fontSize === 'text-xl' ? 'text-5xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white mb-4`}>Poll Templates</h2>
                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder=" "
                                className="peer input-base"
                            />
                            <label htmlFor="search" className="label-base">
                                Search templates
                            </label>
                        </div>

                        {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
{isPending && <p className="text-gray-600 dark:text-gray-300">Loading templates...</p>}
{!isPending && !error && (!filteredTemplates || filteredTemplates.length === 0) && (
    <p className="mb-32 text-lg text-center text-gray-600 dark:text-white">No Saved Templates</p>
)}

                        <div className="grid gap-4 mt-4 grid-cols-3">
                            {filteredTemplates.map((template) => (
                                <div key={template.type} className="group relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(template.type);
                                        }}
                                        className="delete-icon-button"
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
                                                ? 'text-zinc-700 dark:text-zinc-300 border-zinc-500/50 dark:border-zinc-400/50 scale-[1.02]'
                                                : 'text-zinc-600 dark:text-zinc-400 border-zinc-500/30 dark:border-zinc-400/30'
                                            }
                                        `}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/10 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                                            <p className="font-medium tracking-wide">{template.type}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <h2 className={`${settings.fontSize === 'text-lg' ? 'text-4xl' : settings.fontSize === 'text-xl' ? 'text-5xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white mb-4`}>Create Poll</h2>

                        {validationError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-red-600 dark:text-red-400 text-sm">{validationError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    id="template-title"
                                    value={templateTitle}
                                    onChange={(e) => setTemplateTitle(e.target.value)}
                                    placeholder=" "
                                    className="peer input-base"
                                />
                                <label htmlFor="template-title" className="label-base">
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
                                    className="peer input-base resize-none"
                                ></textarea>
                                <label htmlFor="description" className="textarea-label">
                                    Description/Question
                                </label>
                            </div>

                            <label className="block font-semibold mb-4 text-gray-900 dark:text-white">
                                Options
                            </label>

                            {options.map((option, index) => (
                                <div key={index} className="flex items-center mb-4">
                                    <div className="relative flex-grow">
                                        <textarea
                                            id={`option-${index}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder=" "
                                            className="peer input-base h-12 resize-none"
                                        ></textarea>
                                        <label htmlFor={`option-${index}`} className="textarea-label">
                                            Option {index + 1}
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        aria-label={`Add option after option ${index + 1}`}
                                        className={`group button-neumorphic button-variant-green ${isAtMaxOptions ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => handleAddOption(index)}
                                        disabled={isAtMaxOptions}
                                    >
                                        <PlusCircleOutline className={`w-6 h-6 ${isAtMaxOptions ? 'opacity-50' : 'group-hover:rotate-90'} transition-transform duration-300`} />
                                    </button>

                                    <button
                                        type="button"
                                        aria-label={`Delete option ${index + 1}`}
                                        className={`group button-neumorphic button-variant-red ${isAtMinOptions ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => handleDeleteOption(index)}
                                        disabled={isAtMinOptions}
                                    >
                                        <TrashOutline className={`w-6 h-6 ${isAtMinOptions ? 'opacity-50' : 'group-hover:scale-110 group-hover:animate-wiggle'} transition-transform duration-300`} />
                                    </button>
                                </div>
                            ))}

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
                                <button type="submit" className="end-button end-button-green">
                                    <span className="relative z-10">Create Poll</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="end-button end-button-red"
                                >
                                    <span className="relative z-10">Reset</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveTemplate}
                                    className="end-button end-button-sky"
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