import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { UserAuth } from "../context/AuthContext";

const Upload = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("");

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      // Basic validation
      if (selected.size > 5 * 1024 * 1024) {
        alert("File is too large! Please choose an image under 5MB.");
        return;
      }

      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file || !session) return;

    try {
      setAnalyzing(true);

      // 1. Upload Image to Supabase Storage
      setStatus("Uploading image to cloud...");
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('plant-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName);

      // 2. Send URL to Python Backend
      setStatus("AI is analyzing root potential...");

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicUrl,
          days_propagating: 0 // Always starts at Day 0
        })
      });

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.statusText}`);
      }

      const analysisResult = await response.json();

      // 3. Save Results to Database
      setStatus("Saving results...");

      const { error: dbError } = await supabase
        .from('plants')
        .insert({
          user_id: session.user.id,
          image_url: publicUrl,
          nickname: `Experiment #${Math.floor(Math.random() * 1000)}`,
          days_propagating: 0, // Initialized to 0
          species: analysisResult.species || "Unknown",
          success_rate: analysisResult.success_rate,
          health_status: analysisResult.health_status,
          feedback: analysisResult.feedback
        });

      if (dbError) throw dbError;

      // 4. Success! Go to Dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error("Error:", error);
      setStatus("Analysis failed. (Backend offline?)");
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">New Analysis</h1>
      <p className="text-gray-500 dark:text-stone-400 mb-8">Upload a clear photo of your fresh cutting.</p>

      {/* Main Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-gray-100 dark:border-stone-700 p-8 transition-colors">

        {/* Image Preview Area */}
        {preview ? (
          <div className="mb-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-stone-900 group border border-gray-200 dark:border-stone-600">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />

              {/* Remove Button */}
              {!analyzing && (
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-all cursor-pointer"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          // Upload Zone
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-stone-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-stone-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📸</span>
              <p className="mb-2 text-sm text-gray-500 dark:text-stone-400"><span className="font-semibold text-emerald-600 dark:text-emerald-400">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-400 dark:text-stone-500">JPG, PNG (MAX. 5MB)</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}

        {/* Action Button */}
        {file && !analyzing && (
          <button
            onClick={handleUpload}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✨</span> Start Analysis
          </button>
        )}

        {/* Loading State */}
        {analyzing && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-600 mb-4"></div>
            <p className="text-lg font-medium text-emerald-800 dark:text-emerald-400 animate-pulse">{status}</p>
            <p className="text-sm text-gray-400 mt-2">Connecting to Lab Interface...</p>

            {status.includes("failed") && (
              <button
                onClick={() => setAnalyzing(false)}
                className="mt-4 text-sm text-red-500 hover:text-red-700 underline cursor-pointer"
              >
                Try Again
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Upload;
