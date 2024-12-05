import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { useAccessibility } from './AccessibilityContext';
import { useAuth } from './context/AuthContext';
import CustomPieChart from './PieChart';
import AnimatedPollOptions from './AnimatedPollOptions';

import {
    appDomain,
    apiDomain,
    wsDomain
} from "./Config"

const LoadingSpinner = () => (
    <div className="inline-block h-5 w-5 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
);

const CheckMark = () => (
    <span className="mr-2 text-lg">✓</span>
);

const MultiSelectionIndicator = () => (
    <div className="mb-4 p-4 rounded-lg bg-blue-100/50 dark:bg-blue-900/50 border-2 border-blue-500/30 dark:border-blue-400/30">
        <div className="flex items-center">
            <span className="mr-2">☑️</span>
            <p className="font-medium text-blue-700 dark:text-blue-300">
                You can select multiple options for this question.
            </p>
        </div>
    </div>
);

const AnonymityIndicator = ({ isAnonymous }) => (
    <div className={`
        mb-4 p-4 rounded-lg 
        ${isAnonymous === "1" 
            ? "bg-green-100/50 dark:bg-green-900/50 border-2 border-green-500/30 dark:border-green-400/30"
            : "bg-yellow-100/50 dark:bg-yellow-900/50 border-2 border-yellow-500/30 dark:border-yellow-400/30"
        }
    `}>
        <div className="flex items-center">
            <span className="mr-2">
                {isAnonymous === "1" ? "🔒" : "👥"}
            </span>
            <p className={`
                font-medium
                ${isAnonymous === "1"
                    ? "text-green-700 dark:text-green-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }
            `}>
                {isAnonymous === "1"
                    ? "This is an anonymous poll. Your identity will be hidden from other participants and the organizer."
                    : "This is not an anonymous poll. The organizer will be able to see your choices."
                }
            </p>
        </div>
    </div>
);

const VotePoll = () => {
    const { isAuthenticated, redirectToLogin } = useAuth();
    const { poll_id } = useParams();
    const { settings } = useAccessibility();

    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [lastSubmittedOptions, setLastSubmittedOptions] = useState({});
    const [revealed, setRevealed] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');
    const [hoveredOption, setHoveredOption] = useState(null);
    const [socket, setSocket] = useState(null);
    const [selectedResultOption, setSelectedResultOption] = useState({});

    useEffect(() => {
        if (isAuthenticated === false) {
            redirectToLogin();
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return <div>Redirecting to login...</div>;
    if (!isAuthenticated) return null;

    useEffect(() => {
        if (!poll_id) return;

        const ws = new WebSocket(`${wsDomain}/${poll_id}/`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.results_revealed) {
                    setRevealed(true);
                    fetchPollData();
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setError('WebSocket connection error');
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        setSocket(ws);

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [poll_id]);

    const fetchPollData = async () => {
        setIsPending(true);
        try {
            const response = await fetch(`${apiDomain}/${poll_id}`);
            if (!response.ok) throw new Error('Failed to fetch poll data');
            const data = await response.json();
            setPollData(data);
            if (data.metadata?.revealed === "1") {
                setRevealed(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsPending(false);
        }
    };

    useEffect(() => {
        if (poll_id) {
            fetchPollData();
        }
    }, [poll_id]);

    const hasChangedSelection = () => {
        if (!selectedOptions || !lastSubmittedOptions) return true;
        
        const questionIndices = Object.keys(selectedOptions);
        const lastSubmittedIndices = Object.keys(lastSubmittedOptions);
        
        if (questionIndices.length !== lastSubmittedIndices.length) return true;
        
        return questionIndices.some(questionIndex => {
            const currentQuestion = selectedOptions[questionIndex] || {};
            const lastSubmitted = lastSubmittedOptions[questionIndex] || {};
            
            const selectedIndices = Object.keys(currentQuestion).filter(key => currentQuestion[key]);
            const lastSubmittedIndices = Object.keys(lastSubmitted).filter(key => lastSubmitted[key]);
            
            if (selectedIndices.length !== lastSubmittedIndices.length) return true;
            return selectedIndices.some(index => !lastSubmitted[index]);
        });
    };

    const handleOptionChange = (questionIndex, optionIndex, option) => {
        setSelectedOptions(prevSelectedOptions => {
            const newSelectedOptions = {...prevSelectedOptions};
            if (!newSelectedOptions[questionIndex]) {
                newSelectedOptions[questionIndex] = {};
            }
            
            if (pollData.metadata.questions[questionIndex].multi_selection === "1") {
                newSelectedOptions[questionIndex] = {
                    ...newSelectedOptions[questionIndex],
                    [optionIndex]: !newSelectedOptions[questionIndex][optionIndex]
                };
            } else {
                newSelectedOptions[questionIndex] = {
                    [optionIndex]: true
                };
            }
            return newSelectedOptions;
        });
        
        if (submitStatus === 'submitted') {
            setSubmitStatus('idle');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const hasSelections = pollData.metadata.questions.every((_, index) => {
            const questionOptions = selectedOptions[index] || {};
            return Object.values(questionOptions).some(value => value);
        });
        
        if (!hasSelections) return;

        setSubmitStatus('submitting');

        const questions = pollData.metadata.questions.map((_, questionIndex) => ({
            votes: Object.keys(selectedOptions[questionIndex] || {})
                .filter(optionIndex => selectedOptions[questionIndex][optionIndex])
                .map(optionIndex => pollData.metadata.questions[questionIndex].options[optionIndex])
        }));

        try {
            const response = await fetch(`${apiDomain}/${poll_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ questions })
            });

            if (!response.ok) {
                throw new Error("Failed to submit vote");
            }

            setSubmitStatus('submitted');
            setLastSubmittedOptions({...selectedOptions});
            await fetchPollData();
        } catch (error) {
            console.error("Error submitting vote:", error);
            setSubmitStatus('idle');
        }
    };

    const getSubmitButtonContent = () => {
        if (!pollData?.metadata?.questions) return 'Select an option for all questions';

        const hasSelections = pollData.metadata.questions.every((_, index) => {
            const questionOptions = selectedOptions[index] || {};
            return Object.values(questionOptions).some(value => value);
        });
        
        const canSubmit = hasSelections && (submitStatus !== 'submitted' || hasChangedSelection());

        if (submitStatus === 'submitting') {
            return (
                <>
                    <LoadingSpinner />
                    Submitting...
                </>
            );
        }

        if (submitStatus === 'submitted' && !hasChangedSelection()) {
            return (
                <>
                    <CheckMark />
                    Vote Recorded
                </>
            );
        }

        return canSubmit ? 'Submit Vote' : 'Select an option for all questions';
    };

    const getVotersForOption = (questionIndex, option) => {
        if (!pollData?.results) return [];
        
        const questionResults = pollData.results[questionIndex];
        if (!questionResults?.votes) return [];

        return Object.entries(questionResults.votes)
            .filter(([_, selectedOptions]) => selectedOptions.includes(option))
            .map(([voterId]) => voterId);
    };

    const optionCardClasses = (questionIndex, optionIndex) => `
        relative overflow-hidden
        w-full cursor-pointer 
        rounded-2xl
        bg-gradient-to-r from-gray-50 to-gray-100
        dark:from-gray-800 dark:to-gray-750
        border-2
        transition-all duration-300 ease-in-out
        ${selectedOptions[questionIndex]?.[optionIndex] || hoveredOption === `${questionIndex}-${optionIndex}`
            ? `
                text-zinc-700 dark:text-zinc-300
                border-zinc-500/50 dark:border-zinc-400/50
                shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(113,113,122,0.3)]
                dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(161,161,170,0.3)]
                scale-[1.02]
            `
            : `
                text-zinc-600 dark:text-zinc-400
                border-zinc-500/30 dark:border-zinc-400/30
                shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(113,113,122,0.2)]
                dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(161,161,170,0.2)]
                scale-100
            `
        }
    `;

    const renderResults = () => {
        if (!pollData?.metadata?.questions) {
            return <div>No poll data available</div>;
        }

        return (
            <div className="poll-inner-container">
                <h2 className={`${settings.fontSize === 'text-big' ? 'text-3xl' : settings.fontSize === 'text-bigger' ? 'text-4xl' : 'text-2xl'} font-bold text-center text-gray-900 dark:text-white mb-4`}>
                    Poll Results
                </h2>
                
                {pollData.metadata.questions.map((question, questionIndex) => {
                    const questionResults = pollData.results?.[questionIndex];
                    const voteCounts = questionResults?.counts || {};

                    return (
                        <div key={questionIndex} className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <h3 className="text-xl text-gray-900 dark:text-white mb-4 font-semibold">Question {questionIndex + 1}</h3>

                            <div className="relative mb-6">
                                <textarea
                                    value={question.description}
                                    readOnly
                                    placeholder=" "
                                    className="input-base resize-none hover:text-lg focus:text-lg peer"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                                        Options Overview
                                    </h4>
                                    <AnimatedPollOptions 
                                        options={question.options}
                                        counts={voteCounts}
                                        selectedOption={selectedResultOption[questionIndex]}
                                        setSelectedOption={(option) => {
                                            setSelectedResultOption(prev => ({
                                                ...prev,
                                                [questionIndex]: option
                                            }));
                                        }}
                                        getVotersForOption={(option) => getVotersForOption(questionIndex, option)}
                                        isAnonymous={pollData.metadata.anonymous === "1"}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h4 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                                        Visual Breakdown
                                    </h4>
                                    <div>
                                        {Object.values(voteCounts).some(count => count > 0) ? (
                                            <CustomPieChart
                                                series={[{
                                                    data: question.options.map(option => ({
                                                        id: option,
                                                        label: option,
                                                        value: Number(voteCounts[option] || 0)
                                                    })),
                                                    highlightScope: {
                                                        fade: 'global',
                                                        highlight: 'item'
                                                    },
                                                    faded: {
                                                        innerRadius: 0,
                                                        additionalRadius: -5,
                                                        color: 'gray'
                                                    },
                                                }]}
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                No votes yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

);
};

if (isPending) return (
    <div className={`min-h-screen max-w-full bg-[#121212] flex justify-center p-4 ${settings.fontSize} ${settings.fontFamily} ${settings.fontStyle}`}>
        <div className="w-full bg-gray-900 rounded-lg shadow-md p-8 md:p-12">
            <p className="text-center text-gray-300">Loading poll data...</p>
        </div>
    </div>
);

if (error) return (
    <div className={`min-h-screen max-w-full bg-[#121212] flex justify-center p-4 ${settings.fontSize} ${settings.fontFamily} ${settings.fontStyle}`}>
        <div className="w-full bg-gray-900 rounded-lg shadow-md p-8 md:p-12">
            <p className="text-center text-red-500">Error: {error}</p>
        </div>
    </div>
);

if (revealed || pollData?.metadata?.revealed === "1") {
    return (
        <div className={`min-h-screen max-w-full bg-[#121212] flex justify-center p-4 ${settings.fontSize} ${settings.fontFamily} ${settings.fontStyle}`}>
            <div className="w-full bg-gray-900 rounded-lg shadow-md p-8 md:p-12">
                {renderResults()}
            </div>
        </div>
    );
}

return (
    <div className={`min-h-screen max-w-full bg-[#121212] flex justify-center p-4 ${settings.fontSize} ${settings.fontFamily} ${settings.fontStyle}`}>
        <div className="w-full bg-gray-900 rounded-lg shadow-md p-8 md:p-12">
            <h2 className={`${settings.fontSize === 'text-big' ? 'text-3xl' : settings.fontSize === 'text-bigger' ? 'text-4xl' : 'text-2xl'} font-bold text-center text-white mb-4`}>
                Cast Your Vote
            </h2>

            {pollData && <AnonymityIndicator isAnonymous={pollData.metadata.anonymous} />}

            <form onSubmit={handleSubmit} className="space-y-8">
                {pollData?.metadata?.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="mb-8 p-6 bg-gray-800 rounded-lg shadow-sm">
                        <h3 className="text-xl text-gray-900 dark:text-white mb-4 font-semibold">Question {questionIndex + 1}</h3>

                        <div className="relative mb-6">
                            <textarea
                                value={question.description}
                                readOnly
                                placeholder=" "
                                rows="3"
                                className="input-base resize-none hover:text-lg focus:text-lg peer"
                            />
                        </div>

                        {question.multi_selection === "1" && <MultiSelectionIndicator />}

                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            {question.options.map((option, optionIndex) => (
                                <div
                                    key={optionIndex}
                                    className={optionCardClasses(questionIndex, optionIndex)}
                                    onClick={() => handleOptionChange(questionIndex, optionIndex, option)}
                                    onMouseEnter={() => setHoveredOption(`${questionIndex}-${optionIndex}`)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    <div className="relative z-10 p-4">
                                        <div className="flex items-center">
                                            <input
                                                type={question.multi_selection === "1" ? "checkbox" : "radio"}
                                                name={`poll-option-${questionIndex}`}
                                                checked={selectedOptions[questionIndex]?.[optionIndex] || false}
                                                onChange={() => {}}
                                                className="mr-3 w-5 h-5"
                                            />
                                            <span className="font-medium">{option}</span>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:to-black/10" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={submitStatus === 'submitting'}
                    className="end-button end-button-sky w-full"
                >
                    {getSubmitButtonContent()}
                </button>
            </form>
        </div>
    </div>
);
};

export default VotePoll;