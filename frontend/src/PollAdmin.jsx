import React, { useState } from 'react';
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAccessibility } from './AccessibilityContext';
import { useAuth } from './context/AuthContext';

import CustomPieChart from './PieChart';
import AnimatedPollOptions from './AnimatedPollOptions';

import {
    appDomain,
    apiDomain,
    wsDomain
} from "./Config"

const PollAdmin = () => {
    const { isAuthenticated, redirectToLogin } = useAuth();
    const location = useLocation();
    const { poll_id, redirect_url } = location.state || {};
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [copySuccess, setCopySuccess] = useState(false);
    const { settings } = useAccessibility();

    useEffect(() => {
        if (isAuthenticated === false) {
            redirectToLogin();
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return <div>Redirecting to login...</div>;
    if (!isAuthenticated) return null;

    const fetchPollData = () => {
        if (!redirect_url) {
            setError("No redirect URL provided");
            setIsPending(false);
            return;
        }

        fetch(`${apiDomain}${redirect_url}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch poll data");
                return res.json();
            })
            .then(data => {
                setPollData(data);
                setIsPending(false);
                setError(null);
                setIsRevealed(data.metadata.revealed === "1");
            })
            .catch(err => {
                setError(err.message);
                setIsPending(false);
            });
    };

    useEffect(() => {
        fetchPollData();
        const intervalId = setInterval(fetchPollData, 1000);
        return () => clearInterval(intervalId);
    }, [redirect_url]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${appDomain}/${poll_id}`);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleReveal = () => {
        fetch(`${apiDomain}${redirect_url}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revealed: "1" })
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to reveal poll results");
                return res.json();
            })
            .then(() => setIsRevealed(true))
            .catch((err) => console.error("Error revealing poll:", err));
    };

    const getVotersForOption = (questionIndex, option) => {
        if (!pollData?.results?.[questionIndex]?.votes) return [];
        return Object.entries(pollData.results[questionIndex].votes)
            .filter(([_, votes]) => votes.includes(option))
            .map(([voter]) => voter);
    };

    if (isPending) return (
        <div className="poll-dashboard-container">
            <p className="loading-message">Loading poll data...</p>
        </div>
    );

    if (error) return (
        <div className="poll-dashboard-container">
            <p className="error-message">Error: {error}</p>
        </div>
    );

    if (!pollData || !pollData.metadata) return (
        <div className="poll-dashboard-container">
            <p className="loading-message">No poll data available.</p>
        </div>
    );

    return (
<div className={`
    min-h-screen max-w-full 
    bg-[#ECEFF1] dark:bg-[#0A0A0A]
    flex justify-center p-[1em]
    ${settings.fontSize}
    ${settings.fontFamily}
    ${settings.fontStyle}
`}>
    <div className="w-full bg-[#DEE4E7] dark:bg-gray-900 rounded-lg shadow-md p-[1.5em] md:p-[2em]">
                <h2 className={`${settings.fontSize === 'text-big' ? 'text-3xl' : settings.fontSize === 'text-bigger' ? 'text-4xl' : 'text-2xl'} font-bold text-center text-gray-900 dark:text-white mb-4`}>
                    Voting Dashboard
                </h2>

                <div className="mb-[1.5em]">
                    <div className="flex gap-[1em] items-cente">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                id="poll-url"
                                value={`${appDomain}/${poll_id}`}
                                readOnly
                                placeholder=" "
                                className="input-base text-inherit-size peer"
                            />
                            <label htmlFor="poll-url" className="label-base">
                                Poll URL
                            </label>
                        </div>
                        <button
    onClick={handleCopy}
    className="button-variant-sky whitespace-nowrap text-inherit-size
    px-[0.75em] py-[0.5em] sm:px-[1em] sm:py-[0.75em] md:px-[1.5em] md:py-[1em]
    min-w-[6em] sm:min-w-[8em]
    text-sm sm:text-base"
>
    <span className="relative z-10">
        {copySuccess ? 'Copied!' : 'Copy URL'}
    </span>
</button>
                    </div>
                </div>

                {pollData.metadata.anonymous === "1" && (
                   <div className="mb-[1.5em] p-[1em] rounded-lg bg-blue-100/50 dark:bg-blue-900/50 border-2 border-blue-500/30 dark:border-blue-400/30">
                        <div className="flex items-center">
                            <span className="mr-2">🔒</span>
                            <p className="font-medium text-blue-700 dark:text-blue-300">
                                This is an anonymous poll. Voter identities are hidden.
                            </p>
                        </div>
                    </div>
                )}

                {pollData.metadata.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="p-[1.5em] md:p-[2em] bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
                        <h3 className="text-xl text-gray-900 dark:text-white mb-4 font-semibold">Question {questionIndex + 1}</h3>

                        <div className="relative mb-6">
                            <textarea
                                value={question.description}
                                readOnly
                                placeholder=" "
                                rows="3"
                                className="input-base resize-none text-inherit-size peer"
                            ></textarea>
                        </div>

                        <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                                    <h4 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-center text-gray-900 dark:text-white`}>
                                        Options Overview
                                    </h4>
                                    <AnimatedPollOptions
    options={question.options}
    counts={pollData.results[questionIndex]?.counts || {}}
    selectedOption={selectedOptions[questionIndex]}
    setSelectedOption={(option) => {
        setSelectedOptions(prev => ({
            ...prev,
            [questionIndex]: option
        }));
    }}
    isAnonymous={pollData.metadata.anonymous === "1"}
    getVotersForOption={pollData.metadata.anonymous === "1" ? 
        () => [] : 
        (option) => getVotersForOption(questionIndex, option)
    }
/>
                                </div>

                                <div className="flex flex-col">
        <h4 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-center text-gray-900 dark:text-white`}>
            Visual Breakdown
        </h4>
        <div className="h-[280px] lg:h-[320px]">
            {Object.values(pollData.results[questionIndex]?.counts || {}).some(count => count > 0) ? (
                <CustomPieChart
                    series={[{
                        data: question.options.map(option => ({
                            id: option,
                            label: option,
                            value: Number(pollData.results[questionIndex]?.counts?.[option] || 0)
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
                    </div>
                ))}

                <div className="mt-6">
                    {!isRevealed ? (
                        <button
                            onClick={handleReveal}
                            className="reveal-button w-full"
                        >
                            <span className="relative z-10">Reveal Poll Results</span>
                        </button>
                    ) : (
                        <button
                            disabled
                            className="revealed-button w-full"
                        >
                            <span className="relative z-10">Results Revealed</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PollAdmin;