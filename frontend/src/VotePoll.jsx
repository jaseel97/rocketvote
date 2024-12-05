import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { useAccessibility } from './AccessibilityContext';
import CustomPieChart from './PieChart';
import { useAuth } from './context/AuthContext';
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

const VotePoll = () => {
    const { isAuthenticated, redirectToLogin } = useAuth();

    
    useEffect(() => {
        if (isAuthenticated === false) {
            redirectToLogin();
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return <div>Redirecting to login...</div>;
    if (!isAuthenticated) return null;

    const { poll_id } = useParams();
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [revealed, setRevealed] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');
    const [lastSubmittedOptions, setLastSubmittedOptions] = useState({});
    const [hoveredOption, setHoveredOption] = useState(null);
    const [socket, setSocket] = useState(null);
    const { settings } = useAccessibility();
    const [selectedResultOption, setSelectedResultOption] = useState(null);

    const MultiSelectionIndicator = () => (
        <div className="mb-4 p-4 rounded-lg bg-blue-100/50 dark:bg-blue-900/50 border-2 border-blue-500/30 dark:border-blue-400/30">
            <div className="flex items-center">
                <span className="mr-2">☑️</span>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                    You can select multiple options in this poll.
                </p>
            </div>
        </div>
    );

    useEffect(() => {
        if (!poll_id) return;

        const ws = new WebSocket(`${wsDomain}/${poll_id}/`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.results_revealed) {
                setRevealed(true);
                fetchPollData();
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
        try {
            const response = await fetch(`${apiDomain}/${poll_id}`);
            if (!response.ok) throw new Error('Failed to fetch poll data');
            const data = await response.json();
            setPollData(data);
            setIsPending(false);
            if (data.metadata.revealed === "1") {
                setRevealed(true);
            }
        } catch (err) {
            setError(err.message);
            setIsPending(false);
        }
    };

    useEffect(() => {
        if (poll_id) {
            fetchPollData();
        }
    }, [poll_id]);

    const handleOptionChange = (index, value) => {
        if (pollData.metadata.multi_selection === "1") {
            setSelectedOptions(prev => ({
                ...prev,
                [index]: !prev[index],
            }));
        } else {
            setSelectedOptions({
                [index]: true,
            });
        }
        if (submitStatus === 'submitted') {
            setSubmitStatus('idle');
        }
    };
    const hasChangedSelection = () => {
        const selectedIndices = Object.keys(selectedOptions).filter(key => selectedOptions[key]);
        const lastSubmittedIndices = Object.keys(lastSubmittedOptions).filter(key => lastSubmittedOptions[key]);

        if (selectedIndices.length !== lastSubmittedIndices.length) return true;
        return selectedIndices.some(index => !lastSubmittedOptions[index]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const hasSelection = Object.values(selectedOptions).some(value => value);
        if (!hasSelection) return;
    
        setSubmitStatus('submitting');
    
        const votes = Object.keys(selectedOptions)
            .filter(index => selectedOptions[index])
            .map(index => pollData.metadata.options[index]);
    
        const data = {
            votes: votes
        };

        try {
            const response = await fetch(`${apiDomain}/${poll_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error("Failed to submit vote");
            }

            setSubmitStatus('submitted');
            setLastSubmittedOptions({ ...selectedOptions });
            await fetchPollData();
        } catch (error) {
            console.error("Error submitting vote:", error);
            setSubmitStatus('idle');
        }
    };

    const AnonymityIndicator = () => (
        <div className={`
            mb-4 p-4 rounded-lg 
            ${pollData.metadata.anonymous === "1" 
                ? "bg-green-100/50 dark:bg-green-900/50 border-2 border-green-500/30 dark:border-green-400/30"
                : "bg-yellow-100/50 dark:bg-yellow-900/50 border-2 border-yellow-500/30 dark:border-yellow-400/30"
            }
        `}>
            <div className="flex items-center">
                <span className="mr-2">
                    {pollData.metadata.anonymous === "1" 
                        ? "🔒" 
                        : "👥"
                    }
                </span>
                <p className={`
                    font-medium
                    ${pollData.metadata.anonymous === "1"
                        ? "text-green-700 dark:text-green-300"
                        : "text-yellow-700 dark:text-yellow-300"
                    }
                `}>
                    {pollData.metadata.anonymous === "1"
                        ? "This is an anonymous poll. Your identity will be hidden from other participants and the organizer."
                        : "This is not an anonymous poll. The organizer will be able to see your choices."
                    }
                </p>
            </div>
        </div>
    );

    const getSubmitButtonContent = () => {
        const hasSelection = Object.values(selectedOptions).some(value => value);
        const canSubmit = hasSelection && (submitStatus !== 'submitted' || hasChangedSelection());

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

        return canSubmit ? 'Submit Vote' : 'Select an option';
    };

    const optionCardClasses = (index) => `
    relative overflow-hidden
    w-full cursor-pointer 
    rounded-2xl
    bg-gradient-to-r from-gray-50 to-gray-100
    dark:from-gray-800 dark:to-gray-750
    border-2
    transition-all duration-300 ease-in-out
    ${selectedOptions[index] || hoveredOption === index
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
    const { description, options } = pollData.metadata;
    const counts = pollData.counts || {};
    const allCounts = { ...counts };
    
    options.forEach(option => {
        if (!(option in allCounts)) {
            allCounts[option] = 0;
        }
    });
    
    const totalVotes = Object.values(allCounts).reduce((sum, count) => sum + Number(count), 0);
    const userVotes = options.filter((option, index) => lastSubmittedOptions[index]);
    
    const pieData = options.map((option) => ({
        id: option,
        label: option,
        value: Number(counts[option] || 0)
    }));

    const getVotersForOption = () => [];
    
    return (
        <div className="poll-inner-container">
            <h2 className={`${settings.fontSize === 'text-big' ? 'text-3xl' : settings.fontSize === 'text-bigger' ? 'text-4xl' : 'text-2xl'} font-bold text-center text-gray-900 dark:text-white mb-4`}>Poll Results</h2>
            
            <div className="relative mb-6">
                <textarea
                    value={description}
                    readOnly
                    placeholder=" "
                    className="input-base resize-none hover:text-lg focus:text-lg peer"
                    rows="3"
                />
                <label className="label-base">
                    Description/Question
                </label>
            </div>
    
            {userVotes.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-sky-100/50 dark:bg-sky-900/50 border-2 border-sky-500/30 dark:border-sky-400/30">
                    <h2 className={`${settings.fontSize === 'text-bigger' ? 'text-xl' : settings.fontSize === 'text-bigger' ? 'text-xl' : 'text-lg'} font-medium text-sky-700 dark:text-sky-300 mb-2`}>You voted for:</h2>
                    <ul className="list-disc list-inside space-y-1">
                        {userVotes.map((vote, index) => (
                            <li key={index} className="text-sky-600 dark:text-sky-400">
                                {vote}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="poll-section-container">
                <div className="poll-section-inner">
                    <div className="two-column-layout">
                        <div className="column">
                            <div className="relative isolate">
                                <h2 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4`}>Overview</h2>
                                
                                <AnimatedPollOptions 
                                    options={options}
                                    counts={counts}
                                    selectedOption={selectedResultOption}
                                    setSelectedOption={setSelectedResultOption}
                                    getVotersForOption={getVotersForOption}
                                    isAnonymous={true}
                                />
                            </div>
                        </div>

                        <div className="column">
                            <div className="relative isolate">
                                <h2 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4`}>Visual Breakdown</h2>
                                <div className="chart-container">
                                    {totalVotes > 0 ? (
                                        <CustomPieChart series={[{
                                            data: pieData,
                                            highlightScope: { fade: 'global', highlight: 'item' },
                                            faded: { innerRadius: 0, additionalRadius: -5, color: 'gray' },
                                        }]} />
                                    ) : (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No votes yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

    if (isPending) return (
        <div className={`
            poll-dashboard-container
            ${settings.fontSize}
            ${settings.fontFamily}
            ${settings.fontStyle}
        `}>
            <p className="loading-message">Loading poll data...</p>
        </div>
    );

    if (error) return (
        <div className={`
    poll-dashboard-container
            ${settings.fontSize}
            ${settings.fontFamily}
            ${settings.fontStyle}
        `}>
            <p className="error-message">Error: {error}</p>
        </div>
    );

    if (revealed || pollData?.metadata?.revealed === "1") {
        return (
            <div className={`
                poll-dashboard-container
                ${settings.fontSize}
                ${settings.fontFamily}
                ${settings.fontStyle}
            `}>
                {renderResults()}
            </div>
        );
    }

    return (
        <div className={`
            poll-dashboard-container
            ${settings.fontSize}
            ${settings.fontFamily}
            ${settings.fontStyle}
        `}>
            <div className="poll-inner-container">
                <h2 className={`${settings.fontSize === 'text-big' ? 'text-3xl' : settings.fontSize === 'text-bigger' ? 'text-4xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white mb-4`}>
                    {pollData?.metadata?.description}
                </h2>
    
                {pollData && <AnonymityIndicator />}
                {pollData?.metadata?.multi_selection === "1" && <MultiSelectionIndicator />}
    
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {pollData?.metadata?.options.map((option, index) => (
                            <div
                                key={index}
                                className={optionCardClasses(index)}
                                onClick={() => handleOptionChange(index, option)}
                                onMouseEnter={() => setHoveredOption(index)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                <div className="relative z-10 p-4">
                                    <div className="flex items-center">
                                        <input
                                            type={pollData.metadata.multi_selection === "1" ? "checkbox" : "radio"}
                                            name="poll-option"
                                            checked={selectedOptions[index] || false}
                                            onChange={() => { }}
                                            className="mr-3 w-5 h-5"
                                        />
                                        <span className="font-medium">{option}</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:to-black/10" />
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={submitStatus === 'submitting'}
                        className="button-variant-sky w-full"
                    >
                        <span className="relative z-10">{getSubmitButtonContent()}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VotePoll;