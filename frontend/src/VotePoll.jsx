import { useParams } from "react-router-dom";
import useFetch from './useFetch';
import { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ArcElement, Tooltip, ChartDataLabels);

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

const VotePoll = () => {
    const { poll_id } = useParams();
    const { data: pollData, isPending, error } = useFetch(poll_id ? `http://localhost:8080/${poll_id}` : null);
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [selectedOptions, setSelectedOptions] = useState({});
    const [showUsernameModal, setShowUsernameModal] = useState(!username);
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetch(`http://localhost:8080/${poll_id}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.metadata.revealed === "1") {
                        setRevealed(true);
                    }
                })
                .catch((err) => {
                    console.error("Error polling the poll data:", err);
                });
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [poll_id]);

    useEffect(() => {
        if (pollData && pollData.metadata.revealed === "1") {
            setRevealed(true);
        }
    }, [pollData]);

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            localStorage.setItem("username", username);
            setShowUsernameModal(false);
        }
    };

    const handleOptionChange = (index, value) => {
        if (pollData.metadata.multi_selection === "1") {
            setSelectedOptions(prev => ({
                ...prev,
                [index]: !selectedOptions[index],
            }));
        } else {
            setSelectedOptions({
                [index]: true,
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const votes = Object.keys(selectedOptions)
            .filter(index => selectedOptions[index])
            .map(index => pollData.metadata.options[index]);

        const data = {
            voter: username,
            votes: votes
        };

        fetch(`http://localhost:8080/${poll_id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to submit vote");
            }
            return response.json();
        })
        .then(responseData => {
            console.log("Vote successfully submitted:", responseData);
        })
        .catch(error => {
            console.error("Error submitting vote:", error);
        });
    };

    if (isPending) return <p>Loading poll data...</p>;
    if (error) return <p>Error: {error}</p>;

    if (!pollData || !pollData.metadata) return <p>No poll data available.</p>;

    const { description, options, multi_selection, revealed: pollRevealed } = pollData.metadata;
    const counts = pollData.counts || {};
    const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);

    if (pollRevealed === "1" || revealed) {
        const filteredOptions = options.filter(option => counts[option] > 0);
        const voteCounts = filteredOptions.map(option => counts[option]);
        const backgroundColors = generateColors(filteredOptions.length);

        const pieData = {
            labels: filteredOptions,
            datasets: [
                {
                    label: "Votes",
                    data: voteCounts,
                    backgroundColor: backgroundColors,
                    hoverOffset: 10,
                }
            ]
        };

        const pieOptions = {
            responsive: true,
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, context) => {
                        const option = context.chart.data.labels[context.dataIndex];
                        const percentage = ((value / totalVotes) * 100).toFixed(2);
                        return `${option}: ${percentage}%`;
                    },
                    font: {
                        weight: 'bold',
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const option = filteredOptions[tooltipItem.dataIndex];
                            const percentage = ((counts[option] / totalVotes) * 100).toFixed(2);
                            return `${option}: ${percentage}% (${counts[option]} votes)`;
                        }
                    }
                }
            }
        };

        return (
            <div className="max-w-7xl w-full m-auto bg-gray-100 p-8">
                <div className="poll-container bg-white p-8 rounded shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Poll Results</h2>
                    <p className="text-lg mb-4"><strong>Description:</strong> {description}</p>

                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-md">
                            <Pie data={pieData} options={pieOptions} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl w-full m-auto bg-gray-100 p-8">
            <div className="poll-container bg-white p-8 rounded shadow-md">
                <h2 className="text-2xl font-bold mb-4">{description}</h2>

                <form onSubmit={handleSubmit}>
                    {options.map((option, index) => (
                        <div key={index} className="option-item my-2">
                            {multi_selection === "1" ? (
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={selectedOptions[index] || false}
                                        onChange={() => handleOptionChange(index, option)}
                                        className="mr-2"
                                    />
                                    {option}
                                </label>
                            ) : (
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="quiz-option"
                                        value={option}
                                        checked={selectedOptions[index] || false}
                                        onChange={() => handleOptionChange(index, option)}
                                        className="mr-2"
                                    />
                                    {option}
                                </label>
                            )}
                        </div>
                    ))}
                    
                    <button
                        type="submit"
                        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    >
                        Submit
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
                                className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Your Username"
                                autoFocus
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
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
