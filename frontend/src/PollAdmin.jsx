import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useAccessibility } from './AccessibilityContext';
import { useAuth } from './context/AuthContext';
import CustomPieChart from './PieChart';
import AnimatedPollOptions from './AnimatedPollOptions';

import {
    appDomain,
    apiDomain,
    wsDomain
} from "./Config";

const PollAdmin = () => {
    const { isAuthenticated, redirectToLogin } = useAuth();
    const { creation_id, poll_id } = useParams();
    
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const { settings } = useAccessibility();

    useEffect(() => {
        if (isAuthenticated === false) {
            redirectToLogin();
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return <div>Redirecting to login...</div>;
    if (!isAuthenticated) return null;

    useEffect(() => {
        if (!creation_id || !poll_id) {
            setError("Invalid poll URL");
            setIsPending(false);
            return;
        }

        const fetchPollData = () => {
            fetch(`${apiDomain}/create/${creation_id}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch poll data");
                    return res.json();
                })
                .then(data => {
                    setPollData(data);
                    setIsPending(false);
                    setError(null);
                })
                .catch(err => {
                    setError(err.message);
                    setIsPending(false);
                });
        };

        fetchPollData();
        const ws = new WebSocket(`${wsDomain}/${poll_id}/`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.results_revealed) {
                setIsRevealed(true);
                fetchPollData();
            }
            if (data.vote_cast) {
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

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [creation_id, poll_id]);

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
        fetch(`${apiDomain}/create/${creation_id}`, {
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

    const getVotersForOption = (option) => {
        if (!pollData?.votes) return [];
        return Object.entries(pollData.votes)
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

    const { description, options } = pollData.metadata;
    const counts = pollData.counts || {};

    const totalVotes = options
        .map(option => Number(counts[option] || 0))
        .reduce((sum, count) => sum + count, 0);

    const chartData = options.map((option) => ({
        id: option,
        label: option,
        value: Number(counts[option] || 0)
    }));

    return (
        <div className={`
            poll-dashboard-container
            ${settings.fontSize}
            ${settings.fontFamily}
            ${settings.fontStyle}
        `}>
            <div className="poll-dashboard-inner">
                <h2 className={`${settings.fontSize === 'text-big' ? 'text-3xl' : settings.fontSize === 'text-bigger' ? 'text-4xl' : 'text-2xl'} font-bold text-center text-gray-900 dark:text-white mb-4`}>Voting Dashboard</h2>

                <div className="mb-6">
                    <div className="flex-container">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                id="poll-url"
                                value={`${appDomain}/${poll_id}`}
                                readOnly
                                placeholder=" "
                                className="input-base hover:text-lg focus:text-lg peer"
                            />
                            <label
                                htmlFor="poll-url"
                                className="label-base"
                            >
                                Poll Link
                            </label>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="button-variant-sky"
                        >
                            <span className="relative z-10">
                                {copySuccess ? 'Copied!' : 'Copy URL'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="relative mb-6">
                    <textarea
                        id="description"
                        value={description}
                        readOnly
                        placeholder=" "
                        rows="3"
                        className="input-base resize-none hover:text-lg focus:text-lg peer"
                    ></textarea>
                    <label
                        htmlFor="description"
                        className="label-base"
                    >
                        Description/Question
                    </label>
                </div>

                <div className="poll-section-container">
                    <div className="poll-section-inner">
                        <div className="two-column-layout">
                            <div className="column">
                                <div className="relative isolate">
                                    <h2 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4`}>Overview</h2>

                                    {pollData.metadata.anonymous === "1" && (
                                        <div className="mb-4 p-4 rounded-lg bg-blue-100/50 dark:bg-blue-900/50 border-2 border-blue-500/30 dark:border-blue-400/30">
                                            <div className="flex items-center">
                                                <span className="mr-2">🔒</span>
                                                <p className="font-medium text-blue-700 dark:text-blue-300">
                                                    This is an anonymous poll. Voter identities are hidden.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <AnimatedPollOptions
                                        options={options}
                                        counts={counts}
                                        selectedOption={selectedOption}
                                        setSelectedOption={setSelectedOption}
                                        getVotersForOption={getVotersForOption}
                                        isAnonymous={pollData.metadata.anonymous === "1"}
                                    />

                                    <div className="mt-6">
                                        {!isRevealed ? (
                                            <button
                                                onClick={handleReveal}
                                                className="reveal-button"
                                            >
                                                <span className="relative z-10">Reveal Poll Results</span>
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="revealed-button"
                                            >
                                                <span className="relative z-10">Results Revealed</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="column">
                                <div className="relative isolate">
                                    <h2 className={`${settings.fontSize === 'text-big' ? 'text-2xl' : settings.fontSize === 'text-bigger' ? 'text-3xl' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4`}>Visual Breakdown</h2>
                                    <div className="chart-container">
                                        {totalVotes > 0 ? (
                                            <div className="relative isolate">
                                                <CustomPieChart
                                                    series={[{
                                                        data: chartData,
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
                                            </div>
                                        ) : (
                                            <div className="no-votes-message">
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
        </div>
    );
};

export default PollAdmin;