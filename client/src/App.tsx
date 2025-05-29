import { Auth } from './components/auth/Auth';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/dashboard/Home';
import AcceptInvite from './components/AcceptInvite';

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
          </Routes>
        </Router>
      </div>
    </>
  )
}

export default App
