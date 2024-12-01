import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';

import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import CreatePoll from './CreatePoll';
import PollAdmin from './PollAdmin';
import VotePoll from './VotePoll';

function App() {
    return (
        <AuthProvider>
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
        </AuthProvider>
    );
}
export default App;