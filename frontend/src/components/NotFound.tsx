import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-stone-900 text-gray-800 dark:text-stone-100 p-4">

      {/* Icon */}
      <div className="text-9xl mb-4 animate-bounce">
        🥀
      </div>

      <h1 className="text-6xl font-bold mb-2 text-stone-800 dark:text-stone-200">404</h1>
      <h2 className="text-2xl font-semibold mb-6 text-emerald-800 dark:text-emerald-500">
        Root Not Found
      </h2>

      <p className="text-gray-500 dark:text-stone-400 text-center max-w-md mb-8 text-lg">
        It looks like this path hasn't propagated yet. The page you are looking for has either withered away or never existed.
      </p>

      <Link
        to="/dashboard"
        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-1"
      >
        Return to Garden
      </Link>
    </div>
  );
};

export default NotFound;
