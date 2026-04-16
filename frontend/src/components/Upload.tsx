import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { UserAuth } from "../context/AuthContext";

// Define the shape of our API response for TypeScript
interface AnalysisResult {
  success_rate: number;
  health_status: string;
  feedback: string;
  bbox: [number, number, number, number];
  image_dimensions: [number, number];
  species?: string;
  publicUrl: string; // We'll pass this through so we can save it later
}

const Upload = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // State Machine Variables
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const [yoloError, setYoloError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      if (selected.size > 5 * 1024 * 1024) {
        alert("File is too large! Please choose an image under 5MB.");
        return;
      }

      setFile(selected);
      setPreview(URL.createObjectURL(selected));

      // Reset states if they pick a new photo
      setYoloError(null);
      setResult(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file || !session) return; // Uses the AuthContext session

    try {
      setAnalyzing(true);
      setYoloError(null);

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

      // 2. Send URL to Python Backend (Raspberry Pi)
      setStatus("YOLO is scanning for plant nodes...");
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5008';

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: publicUrl })
      });

      // 3. Handle the Graceful YOLO Failure
      if (response.status === 400) {
        const errData = await response.json();
        setYoloError(errData.message || "No plant node detected.");
        setAnalyzing(false);
        return; // Stop the flow here
      }

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.statusText}`);
      }

      const analysisResult = await response.json();

      // 4. Get a fresh session and instantly rename it to 'freshSession'
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !freshSession) {
        throw new Error("You must be logged in to upload an image.");
      }

      // 5. Prepare the image for PlantNet
      setStatus("Identifying plant species...");
      const formData = new FormData();
      formData.append('images', file);

      // 6. Send securely using the fresh, Supabase-issued access_token
      const edgeFunctionUrl = 'https://avgccadphnhsuljknmhi.supabase.co/functions/v1/identify-plant';

      const functionResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          // Use freshSession.access_token here!
          'Authorization': `Bearer ${freshSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: formData,
      });

      if (!functionResponse.ok) {
        const errText = await functionResponse.text();
        console.error("Edge function error:", errText);
        throw new Error(`Failed to identify plant: ${functionResponse.status}`);
      }

      const plantNetData = await functionResponse.json();

      // Extract the best match
      let actualSpeciesGuess = "Unknown Species";
      if (plantNetData?.results && plantNetData.results.length > 0) {
        actualSpeciesGuess = plantNetData.results[0].species.scientificNameWithoutAuthor;
      }

      // 7. Present Results to User
      setResult({
        ...analysisResult,
        species: actualSpeciesGuess,
        publicUrl: publicUrl
      });

      setAnalyzing(false);

    } catch (error) {
      console.error("Error:", error);
      setStatus("Analysis failed. (Backend offline?)");
      setAnalyzing(false);
    }
  };

  const handleSaveToGarden = async () => {
    if (!result || !session) return;

    try {
      setStatus("Saving to garden...");
      setAnalyzing(true);

      const { error: dbError } = await supabase
        .from('plants')
        .insert({
          user_id: session.user.id,
          image_url: result.publicUrl,
          nickname: `Experiment #${Math.floor(Math.random() * 1000)}`,
          days_propagating: 0,
          species: result.species || "Unknown",
          success_rate: result.success_rate,
          health_status: result.health_status,
          feedback: result.feedback
        });

      if (dbError) throw dbError;

      // Success! Go to Dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Database Error:", error);
      setStatus("Failed to save to database.");
      setAnalyzing(false);
    }
  };

  // Helper to calculate bounding box CSS
  const getBBoxStyle = () => {
    if (!result || !result.bbox) return {};
    const [x1, y1, x2, y2] = result.bbox;
    const [imgWidth, imgHeight] = result.image_dimensions;

    return {
      position: 'absolute' as const,
      border: '3px solid #10B981', // Tailwind Emerald-500
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      left: `${(x1 / imgWidth) * 100}%`,
      top: `${(y1 / imgHeight) * 100}%`,
      width: `${((x2 - x1) / imgWidth) * 100}%`,
      height: `${((y2 - y1) / imgHeight) * 100}%`,
    };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">New Analysis</h1>
      <p className="text-gray-500 dark:text-stone-400 mb-8">Upload a clear photo of your fresh cutting.</p>

      {/* Main Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-gray-100 dark:border-stone-700 p-8 transition-colors">

        {/* --- STATE: INITIAL PREVIEW & UPLOAD --- */}
        {!result && !yoloError && (
          <>
            {preview ? (
              <div className="mb-6">
                <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-stone-900 group border border-gray-200 dark:border-stone-600 inline-block w-full">
                  <img src={preview} alt="Preview" className="w-full h-auto block" />

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
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-stone-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-stone-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📸</span>
                  <p className="mb-2 text-sm text-gray-500 dark:text-stone-400"><span className="font-semibold text-emerald-600 dark:text-emerald-400">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-400 dark:text-stone-500">JPG, PNG (MAX. 5MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
              </label>
            )}

            {file && !analyzing && (
              <button
                onClick={handleUploadAndAnalyze}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✨</span> Start Analysis
              </button>
            )}
          </>
        )}

        {/* --- STATE: LOADING --- */}
        {analyzing && !yoloError && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-600 mb-4"></div>
            <p className="text-lg font-medium text-emerald-800 dark:text-emerald-400 animate-pulse">{status}</p>
            <p className="text-sm text-gray-400 mt-2">Running edge models on Raspberry Pi...</p>
          </div>
        )}

        {/* --- STATE: YOLO ERROR (NO NODE DETECTED) --- */}
        {yoloError && (
          <div className="w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Analysis Failed</h3>
            <p className="text-red-600 dark:text-red-300 mb-6">{yoloError}</p>

            <div className="bg-white dark:bg-stone-800 p-4 rounded-md shadow-sm border border-red-100 dark:border-red-900/30">
              <h4 className="font-semibold text-sm mb-3 dark:text-stone-300">Tips for a successful scan & propagation:</h4>
              <ul className="text-sm list-disc pl-5 text-gray-700 dark:text-stone-400 space-y-2 mb-4">
                <li>Ensure the cut node is clearly visible in the center of the photo.</li>
                <li>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Crucial:</span> A proper cutting should be taken approximately <strong>1 inch below a visible node</strong>.
                </li>
                <li>Remove extreme background clutter (hands, tables, other plants).</li>
                <li>Make sure the lighting is bright and clear.</li>
              </ul>

              {/* Example Image */}
              <div className="mt-4 rounded-md overflow-hidden border border-gray-200 dark:border-stone-700 shadow-sm">
                <img
                  src="/propagate_example.jpg"
                  alt="Example of a healthy plant cutting taken 1 inch below the node"
                  className="w-full h-auto block object-cover"
                />
              </div>
            </div>

            <button
              onClick={() => { setFile(null); setPreview(null); setYoloError(null); }}
              className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-md cursor-pointer"
            >
              Try Another Photo
            </button>
          </div>
        )}

        {/* --- STATE: SUCCESS (REVIEW RESULTS) --- */}
        {result && !analyzing && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">

            {/* Image with Bounding Box Overlay */}
            <div className="relative w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-stone-600">
              <img src={preview!} alt="Analyzed" className="w-full h-auto block" />
              <div style={getBBoxStyle()}></div>
            </div>

            {/* Results Data */}
            <div className="p-5 bg-gray-50 dark:bg-stone-900 shadow-inner rounded-lg border border-gray-200 dark:border-stone-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Prop-a-bility: <span className="text-emerald-600 dark:text-emerald-400">{result.success_rate}%</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-stone-400 mb-3 border-b border-gray-200 dark:border-stone-700 pb-3">
                Detected Species: <span className="font-semibold text-gray-700 dark:text-stone-300">{result.species}</span>
              </p>

              <p className={`font-semibold ${result.health_status === 'Excellent' ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                Status: {result.health_status}
              </p>
              <p className="mt-2 text-gray-700 dark:text-stone-300 text-sm leading-relaxed">
                {result.feedback}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                className="flex-1 py-3 bg-gray-200 dark:bg-stone-700 text-gray-800 dark:text-stone-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-stone-600 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveToGarden}
                className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span>🌱</span> Save to Garden
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Upload;
