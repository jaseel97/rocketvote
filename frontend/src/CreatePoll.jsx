import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "./useFetch";
import { useTheme } from "./ThemeContext";
import { useAuth } from "./context/AuthContext";
import { StyledToggle } from "./StyledToggle";
import { useAccessibility } from "./AccessibilityContext";
import {
  PlusCircleIcon as PlusCircleOutline,
  TrashIcon as TrashOutline,
  XMarkIcon as XMarkOutline,
  PlusIcon as PlusOutline,
} from "@heroicons/react/24/outline";
import { appDomain, apiDomain } from "./Config";

const CreatePoll = () => {
  const { isAuthenticated, redirectToLogin } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { settings } = useAccessibility();

  const [questions, setQuestions] = useState([
    {
      description: "",
      options: ["", "", "", ""],
      multiSelection: false,
    },
  ]);

  const [activeTemplate, setActiveTemplate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (isAuthenticated === false) {
      redirectToLogin();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) return <div>Redirecting to login...</div>;
  if (!isAuthenticated) return null;

  // Fetch Templates
  const {
    data: templates,
    isPending,
    error,
  } = useFetch(`${apiDomain}/templates?_${triggerFetch}`);

  // Validation Functions
  const validateOptions = (options) => {
    const hasEmptyOptions = options.some((option) => !option.trim());
    if (hasEmptyOptions) {
      setValidationError("All options must contain at least one character.");
      return false;
    }

    const normalizedOptions = options.map((opt) => opt.trim().toLowerCase());
    const uniqueOptions = new Set(normalizedOptions);
    if (uniqueOptions.size !== normalizedOptions.length) {
      setValidationError("All options must be unique.");
      return false;
    }

    setValidationError("");
    return true;
  };

  const validateAllQuestions = () => {
    for (const question of questions) {
      if (!validateOptions(question.options)) return false;
    }
    return true;
  };

  // Handler Functions
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        description: "",
        options: ["", "", "", ""],
        multiSelection: false,
      },
    ]);
  };

  const handleDeleteQuestion = (questionIndex) => {
    if (questions.length === 1) {
      setValidationError("At least one question is required.");
      return;
    }
    const newQuestions = questions.filter(
      (_, index) => index !== questionIndex
    );
    setQuestions(newQuestions);
  };

  const handleSaveTemplate = () => {
    if (!templateTitle.trim()) {
      setValidationError("Template title is required.");
      return;
    }

    if (!validateAllQuestions()) return;

    const templateData = {
      title: templateTitle,
      template: {
        questions: questions.map((q) => ({
          description: q.description,
          options: q.options,
          multi_selection: q.multiSelection ? 1 : 0,
        })),
        revealed: 0,
        anonymous: anonymous ? 1 : 0,
      },
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
      .then(() => {
        setTriggerFetch((prev) => prev + 1);
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
        setTriggerFetch((prev) => prev + 1);
      })
      .catch((err) => console.error("Error:", err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAllQuestions()) return;

    fetch(`${apiDomain}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: questions.map((q) => ({
          description: q.description,
          options: q.options,
          multi_selection: q.multiSelection ? 1 : 0,
        })),
        type: activeTemplate || "custom",
        revealed: 0,
        anonymous: anonymous ? 1 : 0,
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
              redirect_url: responseData.redirect_url,
            },
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
    setQuestions([
      {
        description: "",
        options: ["", "", "", ""],
        multiSelection: false,
      },
    ]);
    setActiveTemplate("");
    setAnonymous(false);
    setTemplateTitle("");
  };

  const handleTemplateSelection = (template) => {
    if (!template || !template.template) return;

    setQuestions(
      template.template.questions.map((q) => ({
        description: q.description,
        options: q.options,
        multiSelection: q.multi_selection === 1,
      }))
    );
    setActiveTemplate(template.title);
    setTemplateTitle(template.title);
    setAnonymous(template.template.anonymous === 1);
  };

  const handleAddOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    const currentOptions = newQuestions[questionIndex].options;

    if (currentOptions.length >= 15) {
      setValidationError("Maximum 15 options are allowed per question.");
      return;
    }

    currentOptions.splice(optionIndex + 1, 0, "");
    newQuestions[questionIndex].options = currentOptions;
    setQuestions(newQuestions);
  };

  const handleDeleteOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    const currentOptions = newQuestions[questionIndex].options;

    if (currentOptions.length <= 2) {
      setValidationError("Minimum 2 options are required per question.");
      return;
    }

    newQuestions[questionIndex].options = currentOptions.filter(
      (_, i) => i !== optionIndex
    );
    setQuestions(newQuestions);
  };

  const filteredTemplates = templates
    ? Object.values(templates).filter((template) => {
        if (!template || !template.title) return false;
        return template.title.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  return (
    <div
      className={`
            min-h-screen max-w-full bg-[#ECEFF1] dark:bg-[#292929] flex justify-center p-4
            ${settings.fontSize}
            ${settings.fontFamily}
            ${settings.fontStyle}
        `}
    >
      <div className="w-full bg-[#DEE4E7] dark:bg-gray-900 rounded-lg shadow-md p-8 md:p-12">
        <div className="flex flex-col md:flex-row">
          {/* Templates Section */}
          <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
            <h2
              className={`${
                settings.fontSize === "text-big"
                  ? "text-3xl"
                  : settings.fontSize === "text-bigger"
                  ? "text-4xl"
                  : "text-2xl"
              } font-bold text-gray-900 dark:text-white mb-4`}
            >
              Poll Templates
            </h2>
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
            {isPending && (
              <p className="text-gray-600 dark:text-gray-300">
                Loading templates...
              </p>
            )}
            {!isPending &&
              !error &&
              (!filteredTemplates || filteredTemplates.length === 0) && (
                <p className="mb-32 text-lg text-center text-gray-600 dark:text-white">
                  No Saved Templates
                </p>
              )}

            <div className="grid gap-4 mt-4 grid-cols-3">
              {filteredTemplates.map((template) => (
                <div key={template.title} className="group relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.title);
                    }}
                    aria-label={`Delete ${template.title} template`}
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
                    ${
                      activeTemplate === template.title
                        ? "text-zinc-700 dark:text-zinc-300 border-zinc-500/50 dark:border-zinc-400/50 scale-[1.02]"
                        : "text-zinc-600 dark:text-zinc-400 border-zinc-500/30 dark:border-zinc-400/30"
                    }
                `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/10 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <p className="font-medium tracking-wide">
                        {template.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Poll Section */}
          <div className="w-full md:w-1/2">
            <h2
              className={`${
                settings.fontSize === "text-big"
                  ? "text-3xl"
                  : settings.fontSize === "text-bigger"
                  ? "text-4xl"
                  : "text-2xl"
              } font-bold text-gray-900 dark:text-white mb-4`}
            >
              Create Poll
            </h2>

            {validationError && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {validationError}
                </p>
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

              {questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl text-gray-900 dark:text-white mb-4 font-semibold">
                      Question {questionIndex + 1}
                    </h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(questionIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashOutline className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="relative mb-6">
                    <textarea
                      required
                      value={question.description}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[questionIndex].description =
                          e.target.value;
                        setQuestions(newQuestions);
                      }}
                      placeholder=" "
                      rows="3"
                      className="peer input-base resize-none"
                    ></textarea>
                    <label className="textarea-label">
                      Description/Question
                    </label>
                  </div>

                  {question.options.map((option, optionIndex) => {
    const isAtMaxOptions = question.options.length >= 15;
    const isAtMinOptions = question.options.length <= 2;
    
    return (
        <div key={optionIndex} className="flex items-center mb-6">
            <div className="relative flex-grow">
                <textarea
                    value={option}
                    onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[questionIndex].options[optionIndex] =
                            e.target.value;
                        setQuestions(newQuestions);
                    }}
                    placeholder=" "
                    className="peer input-base h-12 resize-none"
                ></textarea>
                <label className="textarea-label">
                    Option {optionIndex + 1}
                </label>
            </div>

            <button
                type="button"
                aria-label={`Add option after option ${optionIndex + 1}`}
                className={`group button-neumorphic button-variant-green ${
                    isAtMaxOptions ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() =>
                    handleAddOption(questionIndex, optionIndex)
                }
                disabled={isAtMaxOptions}
            >
                <PlusCircleOutline
                    className={`w-6 h-6 ${
                        isAtMaxOptions
                            ? "opacity-50"
                            : "group-hover:rotate-90"
                    } transition-transform duration-300`}
                />
            </button>

            <button
                type="button"
                aria-label={`Delete option ${optionIndex + 1}`}
                className={`group button-neumorphic button-variant-red ${
                    isAtMinOptions ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() =>
                    handleDeleteOption(questionIndex, optionIndex)
                }
                disabled={isAtMinOptions}
            >
                <TrashOutline
                    className={`w-6 h-6 ${
                        isAtMinOptions
                            ? "opacity-50"
                            : "group-hover:scale-110 group-hover:animate-wiggle"
                    } transition-transform duration-300`}
                />
            </button>
        </div>
    );
})}

                  <StyledToggle
                    isChecked={question.multiSelection}
                    onChange={(value) => {
                      const newQuestions = [...questions];
                      newQuestions[questionIndex].multiSelection = value;
                      setQuestions(newQuestions);
                    }}
                    label="Allow Multiple Selections"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuestion}
                className="mb-6 w-full p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <PlusOutline className="w-5 h-5" />
                <span>Add Question</span>
              </button>

              <StyledToggle
                isChecked={anonymous}
                onChange={setAnonymous}
                label="Anonymous Poll"
              />

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
