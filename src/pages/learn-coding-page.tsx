import React from 'react';
import { Link } from 'react-router-dom';
import PythonEditor from '../components/learn-coding/python/python-editor';

const LearnCodingPage: React.FC = () => {
  return (
    <div className='standard-page'>
     <header className='header-content'>
      <nav>
          <Link to="/">Home</Link>
      </nav>
      <h1>Learn Coding</h1>
      <p>Welcome to the Learn Coding!</p>
      {/* Add your content for the learn coding page here */}
      </header>
      {/* Option 1: Add a wrapper div */}
      <div className="flex flex-1 max-md:p-8 md:p-4 overflow-auto">
        <PythonEditor />
      </div>
    </div>
  );
};

export default LearnCodingPage;