import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthWrapper = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleForm = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="animate-fade-in">
      {isLoginMode ? (
        <Login onToggleForm={toggleForm} />
      ) : (
        <Register onToggleForm={toggleForm} />
      )}
    </div>
  );
};

export default AuthWrapper;