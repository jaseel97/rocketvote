import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import CreatePoll from './CreatePoll';
import PollAdmin from './PollAdmin';
import VotePoll from './VotePoll';

function App() {
    return (
        <ThemeProvider>
            <div className="relative">
                <ThemeToggle />
                <Router>
                    <Routes>
                        <Route path="/" element={<CreatePoll />} />
                        <Route path="/create/:pollId" element={<PollAdmin />} />
                        <Route path="/:poll_id" element={<VotePoll />} />
                    </Routes>
                </Router>
            </div>
        </ThemeProvider>
    );
}
export default App;