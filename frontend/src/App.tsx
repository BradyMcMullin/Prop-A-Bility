import React from 'react';
import { Link } from 'react-router-dom';
import { UserAuth } from './context/AuthContext';

function App() {
  const { session } = UserAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-stone-900 text-gray-900 dark:text-white transition-colors duration-300">

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌱</span>
          <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 tracking-tight">Propability</span>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <Link
              to="/dashboard"
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Go to Lab
            </Link>
          ) : (
            <>
              <Link to="/signin" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 font-medium hidden sm:block">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="flex flex-col md:flex-row items-center gap-12">

          {/* Left: Text Content */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-6">
              ✨ AI-Powered Plant Science
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              Stop guessing. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Start propagating.
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-stone-400 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
              Don't waste weeks waiting for roots that will never come. Our computer vision model analyzes your cuttings to predict propagation success rates instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to={session ? "/upload" : "/signup"}
                className="px-8 py-4 bg-emerald-600 text-white text-lg rounded-xl hover:bg-emerald-700 transition font-bold shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                Start Analyzing 📸
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 text-lg rounded-xl hover:bg-gray-200 dark:hover:bg-stone-700 transition font-medium"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Right: Visual/Image Placeholder */}
          <div className="flex-1 relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-stone-700 p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* This simulates a "Analysis Result" card */}
              <div className="aspect-[4/3] bg-gray-200 dark:bg-stone-900 rounded-lg mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-6xl">🌿</div>
                {/* Overlay scanning effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 dark:bg-stone-700 rounded w-1/3"></div>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">88% Success</div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[88%]"></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-3 bg-gray-100 dark:bg-stone-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-100 dark:bg-stone-700 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Feature Grid */}
      <section id="how-it-works" className="bg-gray-50 dark:bg-stone-800/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Science, not magic.</h2>
            <p className="text-gray-500 dark:text-stone-400 max-w-2xl mx-auto">
              Our model is trained on thousands of propagation attempts to recognize the visual indicators of a viable cutting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📸"
              title="1. Snap & Upload"
              desc="Take a clear photo of your plant cutting, ensuring the stem and nodes are visible."
            />
            <FeatureCard
              icon="🧠"
              title="2. AI Analysis"
              desc="Our Transfer Learning model scans for node health, stem hydration, and rot risk."
            />
            <FeatureCard
              icon="📊"
              title="3. Get Results"
              desc="Receive an instant probability score and health breakdown before you even put it in water."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-stone-900 border-t border-gray-100 dark:border-stone-800 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Propability. Senior Capstone Project.</p>
        </div>
      </footer>
    </div>
  );
}

// Simple helper component for the grid
function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-stone-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-stone-700 hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-stone-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default App;
