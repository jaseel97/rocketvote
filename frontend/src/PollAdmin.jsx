import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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

const PollAdmin = () => {
    const location = useLocation();
    const { poll_id, redirect_url } = location.state || {};
    const [pollData, setPollData] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);

    const fetchPollData = () => {
        if (!redirect_url) {
            setError("No redirect URL provided");
            setIsPending(false);
            return;
        }
        
        fetch(`http://localhost:8080${redirect_url}`)
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

    const handleCopy = () => {
        navigator.clipboard.writeText(`http://localhost:5173/${poll_id}`);
    };

    const handleReveal = () => {
        fetch(`http://localhost:8080${redirect_url}`, {
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
                        const option = options[tooltipItem.dataIndex];
                        const percentage = ((counts[option] / totalVotes) * 100).toFixed(2);
                        return `${option}: ${percentage}% (${counts[option]} votes)`;
                    }
                }
            }
        }
    };

    return (
        <div className="max-w-7xl w-full m-auto bg-gray-800 p-8">
            {/* Inner Div with White Background */}
            <div className="poll-container bg-white text-black p-8 rounded-lg shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#910d22' }}>Poll Results</h2>
                
                <div className="mb-6">
                    <label className="block text-lg font-semibold mb-2" style={{ color: '#910d22' }}>Poll ID URL</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={`http://localhost:5173/${poll_id}`}
                            readOnly
                            className="border border-gray-300 bg-gray-100 text-black p-2 flex-1 mr-2 rounded-md" // make text box flexible
                        />
                        <button
                            className="bg-[#910d22] text-white py-2 px-4 rounded-md hover:bg-[#a41f30] transition-colors duration-200"
                            onClick={handleCopy}
                        >
                            Copy URL
                        </button>
                    </div>
                </div>

                {/* Updated Description Paragraph */}
                <p className="text-lg mb-4">
                    <strong style={{ color: '#910d22' }}>Description:</strong> <span style={{ color: 'black' }}>{description}</span>
                </p>

                <h3 className="text-xl font-bold mb-2" style={{ color: '#910d22' }}>Options and Votes</h3>
                <ul className="mb-6 grid grid-cols-2 gap-4">
                    {options.map((option, index) => (
                        <li key={index} className="p-4 border border-gray-300 rounded-md bg-gray-50 transition-shadow duration-200 hover:shadow-md">
                            <span className="font-semibold text-black">{option}:</span> <span className="text-black">{counts[option] || 0} votes</span>
                        </li>
                    ))}
                </ul>

                <h3 className="text-xl font-bold mb-4" style={{ color: '#910d22' }}>Pie Chart</h3>
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-md">
                        <Pie data={pieData} options={pieOptions} />
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
