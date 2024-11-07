import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// const apiDomain="http://rocketvote.com/api"
const apiDomain = "http://localhost:8080";

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

const PollAdmin = () => {
    const location = useLocation();
    const { poll_id, redirect_url } = location.state || {};
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchPollData = () => {
        if (!redirect_url) {
            setError("No redirect URL provided");
            setIsPending(false);
            return;
        }
        
        fetch(`${apiDomain}${redirect_url}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch poll data");
                }
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
        const intervalId = setInterval(() => {
            fetchPollData();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [redirect_url]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`http://rocketvote.com/${poll_id}`);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleReveal = () => {
        fetch(`${apiDomain}/${redirect_url}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ revealed: "1" })
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to reveal poll results");
            }
            return res.json();
        })
        .then((data) => {
            setIsRevealed(true);
        })
        .catch((err) => {
            console.error("Error revealing poll:", err);
        });
    };

    const getVotersForOption = (option) => {
        if (!pollData?.votes) return [];
        return Object.entries(pollData.votes)
            .filter(([_, votes]) => votes.includes(option))
            .map(([voter]) => voter);
    };

    if (isPending) return <p style={{ color: 'black' }}>Loading poll data...</p>;
    if (error) return <p style={{ color: 'black' }}>Error: {error}</p>;

    if (!pollData || !pollData.metadata) return <p style={{ color: 'black' }}>No poll data available.</p>;

    const { description, options } = pollData.metadata;
    const counts = pollData.counts || {};
    const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const backgroundColors = generateColors(options.length);

    const pieData = {
        labels: options.filter(option => counts[option] > 0), 
        datasets: [
            {
                label: "Votes",
                data: options.filter(option => counts[option] > 0).map(option => counts[option]),
                backgroundColor: backgroundColors,
                hoverOffset: 10,
            }
        ]
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            datalabels: {
                display: false // Hide all data labels by default
            },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: (tooltipItem) => {
                        const option = options[tooltipItem.dataIndex];
                        const percentage = ((counts[option] / totalVotes) * 100).toFixed(2);
                        return `${option}: ${percentage}% (${counts[option]} votes)`;
                    }
                }
            }
        },
        onHover: (event, elements) => {
            const chart = event?.chart;
            if (!chart) return;
            
            // Hide all labels
            chart.data.datasets[0].datalabels = { display: false };
            
            if (elements && elements.length > 0) {
                // Show label only for hovered element
                const index = elements[0].index;
                chart.data.datasets[0].datalabels = chart.data.labels.map((_, i) => ({
                    display: i === index,
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
                }));
            }
            chart.update('none');
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const option = options[index];
                setSelectedOption(selectedOption === option ? null : option);
            }
        }
    };

    return (
        <div className="max-w-7xl w-full m-auto bg-gray-800 p-8">
            <div className="poll-container bg-white text-black p-8 rounded-lg shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#910d22' }}>Poll Results</h2>
                
                <div className="mb-6">
                    <label className="block text-lg font-semibold mb-2" style={{ color: '#910d22' }}>Poll ID URL</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={`http://rocketvote.com/${poll_id}`}
                            readOnly
                            className="border border-gray-300 bg-gray-100 text-black p-2 flex-1 mr-2 rounded-md"
                        />
                        <button
                            className={`${
                                copySuccess 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-[#910d22] hover:bg-[#a41f30]'
                            } text-white py-2 px-4 rounded-md transition-colors duration-200`}
                            onClick={handleCopy}
                        >
                            {copySuccess ? 'Copied!' : 'Copy URL'}
                        </button>
                    </div>
                </div>

                <p className="text-lg mb-4">
                    <strong style={{ color: '#910d22' }}>Description:</strong> <span style={{ color: 'black' }}>{description}</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4" style={{ color: '#910d22' }}>Options and Votes</h3>
                        <div className="space-y-4">
                            {options.map((option, index) => (
                                <div 
                                    key={index}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        selectedOption === option ? 'border-[#910d22] shadow-md' : 'border-gray-300'
                                    }`}
                                    onClick={() => setSelectedOption(selectedOption === option ? null : option)}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">{option}</span>
                                        <span>{counts[option] || 0} votes</span>
                                    </div>
                                    {selectedOption === option && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-sm text-gray-600">
                                                Voters: {getVotersForOption(option).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4" style={{ color: '#910d22' }}>Pie Chart</h3>
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-md">
                                <Pie data={pieData} options={pieOptions} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {!isRevealed ? (
                        <button
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200"
                            onClick={handleReveal}
                        >
                            Reveal Poll Results
                        </button>
                    ) : (
                        <button
                            className="bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed"
                            disabled
                        >
                            Revealed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PollAdmin;