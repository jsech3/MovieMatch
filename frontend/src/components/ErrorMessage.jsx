import React from 'react';
import { Link } from 'react-router-dom';

const ErrorMessage = ({ message, actionText = 'Try Again', onAction, showHomeLink = false }) => {
  return (
    <div className="bg-red-600 bg-opacity-20 border border-red-500 text-white rounded-lg p-4 my-4">
      <p className="font-medium mb-3">{message}</p>
      <div className="flex space-x-3">
        {onAction && (
          <button 
            onClick={onAction}
            className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
          >
            {actionText}
          </button>
        )}
        
        {showHomeLink && (
          <Link 
            to="/" 
            className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Return Home
          </Link>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
