import { Auth } from './components/auth/Auth';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/dashboard/Home';
import AcceptInvite from './components/AcceptInvite';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
function App() {
  
  return (
    <>
      <div>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Home />} />
            </Route>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </div>
    </>
  )
}

export default App
