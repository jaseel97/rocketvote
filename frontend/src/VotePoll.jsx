import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";

import CustomPieChart from './PieChart';
import { useAuth } from './context/AuthContext';

import {
    appDomain,
    apiDomain,
    wsDomain
} from "./Config"

const USERNAME_STORAGE_KEY = 'poll_username';
const POLL_ID_STORAGE_KEY = 'last_poll_id';

const LoadingSpinner = () => (
    <div className="inline-block h-5 w-5 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
);

const CheckMark = () => (
    <span className="mr-2 text-lg">✓</span>
);
const UsernameModal = ({ username, setUsername, onSubmit }) => {
    const modalSubmitButtonClasses = `
        px-8 py-3 rounded-2xl 
        relative overflow-hidden
        bg-gradient-to-r from-gray-50 to-gray-100
        dark:from-gray-800 dark:to-gray-750
        font-medium
        border-2
        text-sky-500 dark:text-sky-400
        border-sky-500/30 dark:border-sky-400/30
        shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(14,165,233,0.2)]
        dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(56,189,248,0.2)]
        before:absolute before:inset-0
        before:bg-gradient-to-r
        before:from-sky-500/0 before:via-sky-500/10 before:to-sky-500/0
        before:translate-x-[-200%]
        hover:before:translate-x-[200%]
        before:transition-transform before:duration-1000
        hover:border-sky-500/50 dark:hover:border-sky-400/50
        hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(14,165,233,0.3)]
        dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(56,189,248,0.3)]
        transition-all duration-300 ease-in-out
        w-full
    `;

    const modalInputClasses = `
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
        peer
        transition-all duration-300
    `;

    const modalLabelClasses = `
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm" />
            <div className="relative z-50 bg-[#CFD8DC] dark:bg-gray-800 rounded-lg shadow-lg p-8 w-96 max-w-[90%]">
                <form onSubmit={onSubmit}>
                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={modalInputClasses}
                            placeholder=" "
                            required
                        />
                        <label className={modalLabelClasses}>
                            Enter display name to continue
                        </label>
                    </div>
                    <button
                        type="submit"
                        className={modalSubmitButtonClasses}
                        disabled={!username.trim()}
                    >
                        <span className="relative z-10">Continue</span>
                    </button>
                </form>
            </div>
        </div>
    );
};
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
    const [username, setUsername] = useState("");
    const [selectedOptions, setSelectedOptions] = useState({});
    const [showUsernameModal, setShowUsernameModal] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');
    const [lastSubmittedOptions, setLastSubmittedOptions] = useState({});
    const [hoveredOption, setHoveredOption] = useState(null);
    const [socket, setSocket] = useState(null);
    const [userDetails, setUserDetails] = useState(null);

    const fetchUserDetails = async () => {
        try {
            const response = await fetch(`${apiDomain}/auth/user`);
            if (!response.ok) throw new Error('Failed to fetch user details');
            const data = await response.json();
            setUserDetails(data);
            setUsername(data.name);
            setShowUsernameModal(false);
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    };

    useEffect(() => {
        if (!pollData) return;
    
        if (pollData.metadata.anonymous === "1") {
            const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
            const savedPollId = localStorage.getItem(POLL_ID_STORAGE_KEY);
    
            if (savedUsername && savedPollId === poll_id) {
                setUsername(savedUsername);
                setShowUsernameModal(false);
            } else {
                setShowUsernameModal(true);
                setUsername('');
            }
        } else {
            fetchUserDetails();
        }
    }, [poll_id, pollData]);

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

        // Cleanup on unmount
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [poll_id]);

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            localStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
            localStorage.setItem(POLL_ID_STORAGE_KEY, poll_id);
            setShowUsernameModal(false);
        }
    };

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
            voter: pollData.metadata.anonymous === "1" ? username : userDetails.name,
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

    const submitButtonClasses = `
        px-8 py-3 rounded-2xl 
        relative overflow-hidden
        bg-gradient-to-r from-gray-50 to-gray-100
        dark:from-gray-800 dark:to-gray-750
        font-medium
        border-2
        text-sky-500 dark:text-sky-400
        border-sky-500/30 dark:border-sky-400/30
        shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(14,165,233,0.2)]
        dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(56,189,248,0.2)]
        before:absolute before:inset-0
        before:bg-gradient-to-r
        before:from-sky-500/0 before:via-sky-500/10 before:to-sky-500/0
        before:translate-x-[-200%]
        hover:before:translate-x-[200%]
        before:transition-transform before:duration-1000
        hover:border-sky-500/50 dark:hover:border-sky-400/50
        hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(14,165,233,0.3)]
        dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(56,189,248,0.3)]
        transition-all duration-300 ease-in-out
        w-full mt-6
    `;

    const textareaClasses = `
    block px-2.5 pb-2.5 pt-6 w-full 
    text-base font-medium
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
    hover:text-lg
    focus:text-lg
    not-placeholder-shown:bg-gray-50 dark:not-placeholder-shown:bg-gray-700
    not-placeholder-shown:border-red-500 dark:not-placeholder-shown:border-red-400
    peer 
    transition-all duration-300
    resize-none
`;

    const descriptionLabelClasses = `
    absolute text-xs
    text-red-500 dark:text-red-400 
    duration-300 transform 
    top-2 left-2.5
    z-10 origin-[0] 
    bg-transparent
    px-0
    font-normal
    hover:font-medium
    focus:font-medium
    peer-hover:font-medium
    peer-focus:font-medium
    peer-[&:not(:placeholder-shown)]:font-medium
    peer-hover:top-1
    peer-focus:top-1
    peer-[&:not(:placeholder-shown)]:top-1
    transition-all duration-300
`;

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
    
        return (
            <div className="w-full max-w-6xl bg-[#CFD8DC] dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Poll Results</h2>
                
                <div className="relative mb-6">
                    <textarea
                        value={description}
                        readOnly
                        placeholder=" "
                        className={textareaClasses}
                        rows="3"
                    />
                    <label className={descriptionLabelClasses}>
                        Description/Question
                    </label>
                </div>
    
                {userVotes.length > 0 && (
                    <div className="mb-6 p-4 rounded-lg bg-sky-100/50 dark:bg-sky-900/50 border-2 border-sky-500/30 dark:border-sky-400/30">
                        <h3 className="text-lg font-medium text-sky-700 dark:text-sky-300 mb-2">You voted for:</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {userVotes.map((vote, index) => (
                                <li key={index} className="text-sky-600 dark:text-sky-400">
                                    {vote}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
    
                <div className="bg-transparent rounded-2xl p-6 shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]">
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
        );
    };

    if (isPending) return (
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center">
            <p className="text-gray-900 dark:text-white">Loading poll data...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center">
            <p className="text-red-500 dark:text-red-400">Error: {error}</p>
        </div>
    );

    if (revealed || pollData?.metadata?.revealed === "1") {
        return (
            <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center p-4">
                {renderResults()}
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-[#CFD8DC] dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{pollData?.metadata?.description}</h2>

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
                        className={submitButtonClasses}
                    >
                        <span className="relative z-10">{getSubmitButtonContent()}</span>
                    </button>
                </form>
            </div>

            {showUsernameModal && (
                <UsernameModal
                    username={username}
                    setUsername={setUsername}
                    onSubmit={handleUsernameSubmit}
                />
            )}
        </div>
    );
};

export default VotePoll;