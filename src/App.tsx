import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import LearnCodingPage from './pages/learn-coding-page';
import HomePage from './pages/home';

function App() {
  return (
    <Router basename='/'> {/* Added basename for GitHub Pages */}
      <div className="App">
        {/* <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/learn-coding">Learn Coding</Link>
            </li>
          </ul>
        </nav> */}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn-coding" element={<LearnCodingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
