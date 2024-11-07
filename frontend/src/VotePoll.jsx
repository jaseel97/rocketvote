import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// const apiDomain = "http://rocketvote.com/api";
const apiDomain = "http://localhost:8080";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    ChartDataLabels
);

const generateColors = (numColors) => {
    const colors = [];
    const step = 360 / numColors;

    for (let i = 0; i < numColors; i++) {
        const hue = i * step;
        const color = `hsl(${hue}, 70%, 60%)`;
        colors.push(color);
    }
    return colors;
};

const LoadingSpinner = () => (
    <div className="inline-block h-5 w-5 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
);

const CheckMark = () => (
    <span className="mr-2 text-lg">✓</span>
);

const VotePoll = () => {
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

    useEffect(() => {
        if (!poll_id) return;

        const pollInterval = setInterval(fetchPollData, 1000);
        return () => clearInterval(pollInterval);
    }, [poll_id]);

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            setShowUsernameModal(false);
        }
    };

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
            setShowUsernameModal(true); // Show username modal when changing options after submission
            setUsername(""); // Reset username
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
            voter: username,
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

    const getSubmitButtonStyles = () => {
        const hasSelection = Object.values(selectedOptions).some(value => value);
        const canSubmit = hasSelection && (submitStatus !== 'submitted' || hasChangedSelection());

        const baseStyles = "mt-4 flex items-center justify-center py-2 px-4 rounded transition duration-300 ";

        if (!hasSelection) {
            return baseStyles + "bg-gray-400 cursor-not-allowed text-white opacity-50";
        }

        if (submitStatus === 'submitted' && !hasChangedSelection()) {
            return baseStyles + "bg-green-600 text-white cursor-default hover:bg-green-700";
        }

        if (submitStatus === 'submitting') {
            return baseStyles + "bg-[#910d22] text-white cursor-wait opacity-75";
        }

        return baseStyles + "bg-[#910d22] text-white hover:bg-[#b5162b]";
    };

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
        const voteCounts = options.map(option => Number(allCounts[option] || 0));
        const backgroundColors = generateColors(options.length);

        const chartData = {
            labels: options,
            datasets: [
                {
                    data: voteCounts,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('60%', '50%')),
                    borderWidth: 1,
                    hoverBackgroundColor: backgroundColors.map(color => color.replace('60%', '70%')),
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    formatter: (value, ctx) => {
                        if (totalVotes === 0) return '0%';
                        const percentage = ((value / totalVotes) * 100).toFixed(1);
                        return `${percentage}%`;
                    },
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    display: (context) => context.dataset.data[context.dataIndex] > 0
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            if (totalVotes === 0) return `${context.label}: 0 votes (0%)`;
                            const percentage = ((value / totalVotes) * 100).toFixed(1);
                            return `${context.label}: ${value} votes (${percentage}%)`;
                        }
                    }
                }
            }
        };

        return (
            <div className="poll-container bg-gray-200 p-10 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 max-w-2xl w-full md:max-w-3xl">
                <h2 className="text-2xl font-bold mb-4 text-[#910d22]">Poll Results</h2>
                <p className="text-lg mb-6 text-gray-700">
                    <strong>Description:</strong> {description}
                </p>
                <div className="w-full h-96 mb-6">
                    <Pie data={chartData} options={chartOptions} />
                </div>
                <p className="text-center text-gray-600 mt-4">
                    Total votes: {totalVotes}
                </p>
            </div>
        );
    };

    if (isPending) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="bg-gray-200 p-6 rounded-lg shadow-lg">
                <p className="text-lg">Loading poll data...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="bg-gray-200 p-6 rounded-lg shadow-lg">
                <p className="text-lg text-red-600">Error: {error}</p>
            </div>
        </div>
    );

    if (!pollData?.metadata) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="bg-gray-200 p-6 rounded-lg shadow-lg">
                <p className="text-lg">No poll data available.</p>
            </div>
        </div>
    );

    if (revealed || pollData.metadata.revealed === "1") {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-800">
                {renderResults()}
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="poll-container bg-gray-200 p-10 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 max-w-2xl w-full md:max-w-3xl">
                <h2 className="text-2xl font-bold mb-4 text-[#910d22]">{pollData.metadata.description}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {pollData.metadata.options.map((option, index) => (
                        <div key={index} className="option-item text-2xl">
                            {pollData.metadata.multi_selection === "1" ? (
                                <label className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={selectedOptions[index] || false}
                                        onChange={() => handleOptionChange(index, option)}
                                        className="mr-3 w-5 h-5"
                                    />
                                    <span>{option}</span>
                                </label>
                            ) : (
                                <label className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                        type="radio"
                                        name="quiz-option"
                                        value={option}
                                        checked={selectedOptions[index] || false}
                                        onChange={() => handleOptionChange(index, option)}
                                        className="mr-3 w-5 h-5"
                                    />
                                    <span>{option}</span>
                                </label>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitStatus === 'submitting'}
                        className={getSubmitButtonStyles()}
                    >
                        {getSubmitButtonContent()}
                    </button>
                </form>
            </div>

            {showUsernameModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-96">
                        <h3 className="text-xl font-bold mb-4">Enter Your Username</h3>
                        <form onSubmit={handleUsernameSubmit}>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Your Username"
                                autoFocus
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VotePoll;