import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreatePoll from './CreatePoll';
import PollAdmin from './PollAdmin';
import VotePoll from './VotePoll';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<CreatePoll />} />
                
                <Route path="/create/:pollId" element={<PollAdmin />} />
                
                <Route path="/:poll_id" element={<VotePoll />} />
            </Routes>
        </Router>
    );
}

export default App;
