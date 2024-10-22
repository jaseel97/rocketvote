import { useLocation } from "react-router-dom";
import useFetch from './useFetch';

const PollAdmin = () => {
    const location = useLocation();
    const { redirect_url } = location.state || {};
    const { data: pollData, isPending, error } = useFetch(redirect_url ? `http://localhost:8080${redirect_url}` : null);

    if (isPending) return <p>Loading poll data...</p>;
    if (error) return <p>Error: {error}</p>;

    if (!pollData || !pollData.metadata) return <p>No poll data available.</p>;

    const { description, options, multi_selection } = pollData.metadata;

    return (
        <div className="max-w-7xl w-full m-auto bg-gray-100 p-8">
            <div className="poll-container bg-white p-8 rounded shadow-md">
                <h2 className="text-2xl font-bold mb-4">Poll Information</h2>
                <p><strong>Description:</strong> {description}</p>
                <p><strong>Multi-selection:</strong> {multi_selection === "1" ? "Yes" : "No"}</p>

                <h3 className="text-xl font-bold mb-2">Options:</h3>
                <ul>
                    {options.map((option, index) => (
                        <li key={index} className="my-2">
                            {option}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PollAdmin;
