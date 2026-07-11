import React from 'react';

function Toast({ message, type = 'success' }) {
  if (!message) return null;

  const colors = type === 'error'
    ? 'bg-red-600 text-white'
    : 'bg-green-600 text-white';

  return (
    <div className={`fixed top-24 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg ${colors}`}>
      {message}
    </div>
  );
}

export default Toast;
