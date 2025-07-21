

import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400">Page Not Found</p>
      <Link to="/" className="mt-4 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
        Go Home
      </Link>
    </div>
  );
};
