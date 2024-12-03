import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import CreatePoll from './CreatePoll';
import PollAdmin from './PollAdmin';
import VotePoll from './VotePoll';
import AccessibilityWidget from './AccessibilityWidget';
import { AccessibilityProvider } from './AccessibilityContext';

function App() {
    return (
        <ThemeProvider>
            <AccessibilityProvider>
                <div>
                    <ThemeToggle />
                    <AccessibilityWidget />
                    <Router>
                        <Routes>
                            <Route path="/" element={<CreatePoll />} />
                            <Route path="/create/:pollId" element={<PollAdmin />} />
                            <Route path="/:poll_id" element={<VotePoll />} />
                        </Routes>
                    </Router>
                </div>
            </AccessibilityProvider>
        </ThemeProvider>
    );
}

export default App;