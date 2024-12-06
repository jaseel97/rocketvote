import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';

import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import CreatePoll from './CreatePoll';
import PollAdmin from './PollAdmin';
import VotePoll from './VotePoll';
import AccessibilityWidget from './AccessibilityWidget';
import { AccessibilityProvider } from './AccessibilityContext';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AccessibilityProvider>
                    <div className="relative">
                        <ThemeToggle />
                        <AccessibilityWidget />
                        <Router>
                        <Routes>
                                <Route path="/" element={<CreatePoll />} />
                                <Route path="/:creation_id/manage/:poll_id" element={<PollAdmin />} />
                                <Route path="/:poll_id" element={<VotePoll />} />
                        </Routes>
                        </Router>
                    </div>
                </AccessibilityProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;