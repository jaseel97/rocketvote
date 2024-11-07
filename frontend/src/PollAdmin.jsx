import React from 'react';
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const generateColors = (numColors) => {
    const colors = [];
    const step = 360 / numColors;
    for (let i = 0; i < numColors; i++) {
        const hue = i * step;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
};

const PieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentPercent = 0;
    
    const conicGradient = data.map((item) => {
        const startPercent = currentPercent;
        const itemPercent = (item.value / total) * 100;
        currentPercent += itemPercent;
        return `${item.color} ${startPercent}% ${currentPercent}%`;
    }).join(', ');

    return (
        <div className="relative w-64 h-64 mx-auto">
            <div 
                className="w-full h-full rounded-full transition-all duration-300 ease-in-out"
                style={{ 
                    background: `conic-gradient(${conicGradient})`
                }}
            />
            
            <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white dark:bg-gray-750 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-300 ease-in-out">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Votes
                </div>
            </div>
            
            <div className="mt-8">
                <div className="grid grid-cols-2 gap-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 transition-all duration-300 ease-in-out">
                            <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {item.label} ({((item.value / total) * 100).toFixed(1)}%)
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PollAdmin = () => {
    const location = useLocation();
    const { poll_id, redirect_url } = location.state || {};
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);

    const apiDomain = "http://localhost:8080";

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
        const intervalId = setInterval(fetchPollData, 5000);
        return () => clearInterval(intervalId);
    }, [redirect_url]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`http://127.0.0.1:5173/${poll_id}`);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleReveal = () => {
        fetch(`${apiDomain}/${redirect_url}`, {
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
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center">
            <p className="text-gray-900 dark:text-white">Loading poll data...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center">
            <p className="text-red-500 dark:text-red-400">Error: {error}</p>
        </div>
    );

    if (!pollData || !pollData.metadata) return (
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center">
            <p className="text-gray-900 dark:text-white">No poll data available.</p>
        </div>
    );

    const { description, options } = pollData.metadata;
    const counts = pollData.counts || {};
    const colors = generateColors(options.length);

    const chartData = options
        .filter(option => counts[option] > 0)
        .map((option, index) => ({
            label: option,
            value: counts[option],
            color: colors[index]
        }));

    const inputClasses = `
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
    `;

    const labelClasses = `
        absolute text-xs
        text-red-500 dark:text-red-400 
        duration-300 transform 
        top-2 left-2.5
        z-10 origin-[0] 
        bg-transparent
        px-0
        font-normal
        hover:font-medium
        hover:text-red-600
        focus:font-medium
        peer-hover:font-medium
        peer-focus:font-medium
        peer-[&:not(:placeholder-shown)]:font-medium
        peer-hover:top-1
        peer-focus:top-1
        peer-[&:not(:placeholder-shown)]:top-1
        transition-all duration-300
    `;

    const buttonStyle = `
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
        shrink-0
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

    return (
        <div className="min-h-screen w-full bg-[#ECEFF1] dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-[#CFD8DC] dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Poll Results</h2>

                <div className="mb-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                id="poll-url"
                                value={`http://rocketvote.com/${poll_id}`}
                                readOnly
                                placeholder=" "
                                className={inputClasses}
                            />
                            <label
                                htmlFor="poll-url"
                                className={labelClasses}
                            >
                                Poll URL
                            </label>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={buttonStyle}
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
                        className={`${inputClasses} resize-none`}
                    ></textarea>
                    <label
                        htmlFor="description"
                        className={labelClasses}
                    >
                        Description/Question
                    </label>
                </div>
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Options and Votes</h3>
                        
                        <div className={`grid gap-4 ${options.length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
                            {options.map((option, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedOption(selectedOption === option ? null : option)}
                                    onMouseEnter={() => setHoveredOption(option)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                    className={`
                                        relative overflow-hidden
                                        w-full cursor-pointer 
                                        rounded-2xl
                                        bg-gradient-to-r from-gray-50 to-gray-100
                                        dark:from-gray-800 dark:to-gray-750
                                        border-2
                                        transition-all duration-300 ease-in-out
                                        ${
                                            selectedOption === option || hoveredOption === option
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
                                    `}
                                >
                                    <div className="relative z-10 p-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-left transition-all duration-300 ease-in-out">
                                                {option}
                                            </span>
                                            <span className="font-medium transition-all duration-300 ease-in-out">
                                                {counts[option] || 0} votes
                                            </span>
                                        </div>
                                        
                                        <div className={`
                                            mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700
                                            transition-all duration-300 ease-in-out
                                            ${(selectedOption === option || hoveredOption === option)
                                                ? 'opacity-100 max-h-20'
                                                : 'opacity-0 max-h-0 overflow-hidden'
                                            }
                                        `}>
                                            <p className="text-sm text-left">
                                                Voters: {getVotersForOption(option).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:to-black/10 transition-all duration-300 ease-in-out"></div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            {!isRevealed ? (
                                <button
                                    onClick={handleReveal}
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
                                    <span className="relative z-10">Reveal Poll Results</span>
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className={`${endButtons}
                                        text-gray-400 dark:text-gray-500
                                        border-gray-300/30 dark:border-gray-600/30
                                        shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
                                        dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
                                        before:from-gray-400/0 before:via-gray-400/5 before:to-gray-400/0
                                        cursor-not-allowed`}
                                >
                                    <span className="relative z-10">Results Revealed</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right side: Pie Chart */}
                    <div className="w-full md:w-1/2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Results Visualization</h3>
                        <div className="bg-white dark:bg-gray-750 rounded-2xl p-6 shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]">
                            <PieChart data={chartData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PollAdmin;