import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900 text-gray-800 dark:text-stone-100 transition-colors duration-300">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Simple Leaf Icon built with CSS/SVG */}
          <div className="w-8 h-8 bg-emerald-600 rounded-tr-xl rounded-bl-xl"></div>
          <span className="text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">PlantAI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/signin" className="px-4 py-2 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-4 mt-20 lg:mt-32">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-medium text-sm">
          🌱 Powered by Advanced AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-stone-900 dark:text-white max-w-4xl">
          Identify any plant in <span className="text-emerald-600 dark:text-emerald-500">seconds.</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-stone-400 max-w-2xl mb-10 leading-relaxed">
          Upload a photo and let our AI instantly identify species, diagnose health issues, and give you care tips. The smartest way to grow your garden.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/signup" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            Start Identifying Free
          </Link>
          <Link to="/signin" className="px-8 py-4 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-700 dark:text-stone-200 text-lg font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
            Log In
          </Link>
        </div>

        {/* Decorative Gradient Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-400/20 dark:bg-emerald-600/10 blur-[100px] -z-10 rounded-full pointer-events-none" />
      </main>

    </div>
  );
}

export default App;
