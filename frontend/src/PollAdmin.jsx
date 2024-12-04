import React, { useState } from 'react';
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

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
    
    useEffect(() => {
        if (isAuthenticated === false) {
            redirectToLogin();
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return <div>Redirecting to login...</div>;
    if (!isAuthenticated) return null;


    const location = useLocation();
    const { poll_id, redirect_url } = location.state || {};
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);

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
        <div className="poll-dashboard-container">
            <div className="poll-dashboard-inner">
                <h2 className="poll-heading">Voting Dashboard</h2>

                <div className="mb-6">
                <div className="flex-container">
    <div className="relative flex-1">
        <input
            type="text"
            id="poll-url"
            value={`${appDomain}/${poll_id || pollId}`}
            readOnly
            placeholder=" "
            className="input-base hover:text-lg focus:text-lg" // Added hover and focus effects
        />
        <label
            htmlFor="poll-url"
            className="label-base hover:text-red-600 dark:hover:text-red-400 
                     focus:text-red-600 dark:focus:text-red-400"
        >
            Poll URL
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
        className="input-base resize-none hover:text-lg focus:text-lg"
    ></textarea>
    <label
        htmlFor="description"
        className="textarea-label hover:text-red-600 dark:hover:text-red-400 
                 focus:text-red-600 dark:focus:text-red-400"
    >
        Description/Question
    </label>
</div>

                <div className="poll-section-container">
                    <div className="poll-section-inner">
                        <div className="two-column-layout">
                            <div className="column">
                                <div className="relative isolate">
                                    <h3 className="poll-subheading">Overview</h3>

                                    <AnimatedPollOptions
                                        options={options}
                                        counts={counts}
                                        selectedOption={selectedOption}
                                        setSelectedOption={setSelectedOption}
                                        getVotersForOption={getVotersForOption}
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
                                    <h3 className="poll-subheading">Visual Breakdown</h3>
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