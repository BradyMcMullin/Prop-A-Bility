import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

// 1. Cleaned Interface (Trefle Ready)
interface Plant {
  id: string;
  nickname: string;
  species: string;
  scientific_name?: string | null;
  days_propagating: number;
  success_rate: number;
  health_status: string;
  image_url: string;
  created_at: string;
  sunlight?: string | null;
  toxicity?: string | null;
  edible: boolean | null;
}

const Dashboard = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const [isEditingSpecies, setIsEditingSpecies] = useState(false);
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState("");
  const [speciesSearchResults, setSpeciesSearchResults] = useState<any[]>([]);
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);

  const getFirstName = () => {
    if (!session?.user) return 'Gardener';
    const metaName = session.user.user_metadata?.full_name;
    if (metaName) {
      return metaName.split(' ')[0];
    }
    return session.user.email?.split('@')[0] || 'Gardener';
  };

  const getDaysActive = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    if (session) {
      getPlants();
    }
  }, [session]);

  const getPlants = async () => {
    try {
      setLoading(true);
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setPlants(data as Plant[]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleCardClick = (plant: Plant) => {
    setSelectedPlant(plant);
    setEditNameValue(plant.nickname);
    setIsEditingName(false);
  };

  const handleUpdateName = async () => {
    if (!selectedPlant || !editNameValue.trim()) return;

    try {
      const { error } = await supabase
        .from('plants')
        .update({ nickname: editNameValue })
        .eq('id', selectedPlant.id);

      if (error) throw error;

      const updatedPlants = plants.map(p =>
        p.id === selectedPlant.id ? { ...p, nickname: editNameValue } : p
      );
      setPlants(updatedPlants);
      setSelectedPlant({ ...selectedPlant, nickname: editNameValue });
      setIsEditingName(false);

    } catch (err) {
      console.error("Error updating name:", err);
      alert("Failed to update name");
    }
  };

  // --- SPECIES SEARCH & UPDATE (TREFLE EDGE FUNCTION) ---

  const handleSearchSpecies = async () => {
    if (!speciesSearchQuery.trim()) return;
    setIsSearchingSpecies(true);

    try {

      const { data, error } = await supabase.functions.invoke('trefle-api', {
        body: { action: 'search', query: speciesSearchQuery }
      });

      if (error) {
        throw error;
      }

      // THE X-RAY LOGS

      const results = data?.data || [];

      setSpeciesSearchResults(results);
    } catch (error) {
    } finally {
      setIsSearchingSpecies(false);
    }
  };

  const handleSelectSpeciesMatch = async (match: any) => {
    setIsSearchingSpecies(true);

    try {
      const { data: speciesData, error } = await supabase.functions.invoke('trefle-api', {
        body: { action: 'details', id: match.id }
      });

      if (error) throw error;

      const details = speciesData?.data || {};

      const speciesInfo = details.main_species || details;

      const getLightDescription = (level: number) => {
        if (!level) return null;
        if (level <= 3) return "Low Light";
        if (level <= 6) return "Partial Shade / Indirect";
        if (level <= 8) return "Bright Indirect";
        return "Full Sun";
      };

      if (!selectedPlant) return;

      // Construct the updated plant object with Trefle data
      const updatedPlant: Plant = {
        ...selectedPlant,
        scientific_name: details.scientific_name,
        species: details.common_name || match.common_name,
        sunlight: getLightDescription(speciesInfo.growth?.light),
        edible: speciesInfo.edible || false,
        toxicity: speciesInfo.specifications?.toxicity || null,
      };

      // 1. Save to Supabase to persist the data!
      const { error: dbError } = await supabase
        .from('plants')
        .update({
          scientific_name: updatedPlant.scientific_name,
          species: updatedPlant.species,
          sunlight: updatedPlant.sunlight,
          edible: updatedPlant.edible,
          toxicity: updatedPlant.toxicity
        })
        .eq('id', updatedPlant.id);

      if (dbError) throw dbError;

      // 2. Update Local State
      const updatedPlantsList = plants.map(p =>
        p.id === updatedPlant.id ? updatedPlant : p
      );

      setPlants(updatedPlantsList);
      setSelectedPlant(updatedPlant);

      setIsEditingSpecies(false);
      setSpeciesSearchResults([]);
    } catch (error) {
    } finally {
      setIsSearchingSpecies(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateName();
    }
  };

  const handleDelete = async () => {
    if (!selectedPlant) return;
    const confirmDelete = window.confirm("Are you sure you want to remove this plant from your garden?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', selectedPlant.id);

      if (error) throw error;

      setPlants(plants.filter(p => p.id !== selectedPlant.id));
      setSelectedPlant(null);

    } catch (err) {
      console.error("Error deleting plant:", err);
      alert("Failed to delete plant");
    }
  };

  const handleFeedback = (success: boolean) => {
    alert(success
      ? "Great! We've noted this success for future AI training."
      : "Understood. We've logged this failure to improve our model."
    );
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 75) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200";
    if (rate >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900 text-gray-900 dark:text-white transition-colors duration-300 p-8 relative">

      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">Propagation Lab</h1>
          <p className="text-gray-500 dark:text-stone-400 mt-1 text-lg">
            Welcome back, <span className="font-semibold text-emerald-600 dark:text-emerald-400">{getFirstName()}</span>!
          </p>
        </div>

        <Link
          to="/upload"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg shadow-md transition-colors font-medium flex items-center gap-2"
        >
          + New Analysis
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-600"></div>
          </div>
        )}

        {!loading && plants.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800/50">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-bold">No propagations yet</h3>
            <p className="text-gray-500 dark:text-stone-400 mb-6">
              Upload a photo to see if your cutting will survive.
            </p>
            <Link to="/upload" className="text-emerald-600 font-medium hover:underline">
              Start your first experiment &rarr;
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plants.map((plant) => (
            <div
              key={plant.id}
              onClick={() => handleCardClick(plant)}
              className="group bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 dark:border-stone-700 cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-stone-900 relative">
                <img
                  src={plant.image_url}
                  alt={plant.nickname}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border ${getSuccessColor(plant.success_rate)}`}>
                    {plant.success_rate}% Success
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg truncate mb-1">
                  {plant.nickname || "Unnamed Cutting"}
                </h3>
                {plant.species && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2 italic">
                    {plant.species}
                  </p>
                )}

                {/* FIXED: Uses 'plant' instead of 'selectedPlant' */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {/* Sunlight */}
                  {plant.sunlight && (
                    <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm gap-1">
                      ☀️ {plant.sunlight}
                    </span>
                  )}

                  {/* Toxicity */}
                  {plant.toxicity && plant.toxicity !== "none" && (
                    <span className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm border gap-1">
                      ⚠️ Toxic: {plant.toxicity}
                    </span>
                  )}
                  {plant.toxicity === "none" && (
                    <span className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm border gap-1">
                      ✅ Non-Toxic
                    </span>
                  )}

                  {/* Edibility */}
                  {plant.edible && (
                    <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm gap-1">
                      🍽️ Edible
                    </span>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-stone-400 mb-2">
                    <span>{getDaysActive(plant.created_at)} days active</span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-stone-700 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${plant.success_rate >= 50 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                      style={{ width: `${plant.success_rate || 0}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 dark:border-stone-700 pt-3 mt-2">
                    <span>Health: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{plant.health_status || "Analyzing..."}</span></span>
                    <span>{new Date(plant.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PLANT DETAILS MODAL */}
      {selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

            {/* Left: Image */}
            <div className="w-full md:w-1/2 bg-gray-100 dark:bg-stone-900 relative h-64 md:h-auto">
              <img
                src={selectedPlant.image_url}
                alt={selectedPlant.nickname}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedPlant(null)}
                className="absolute top-4 left-4 md:hidden bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                ✕
              </button>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-6">

                {/* Editable Title */}
                <div className="flex-grow mr-4">
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="text-2xl font-bold bg-gray-100 dark:bg-stone-700 text-gray-900 dark:text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                        autoFocus
                      />
                      <button onClick={handleUpdateName} className="text-emerald-600 hover:text-emerald-700 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded cursor-pointer">
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div
                        onClick={() => setIsEditingName(true)}
                        className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-stone-700/50 rounded-lg p-2 -ml-2 transition-colors w-fit"
                        title="Click to edit name"
                      >
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {selectedPlant.nickname}
                          </h2>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 opacity-60">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </div>
                      </div>

                      {/* SCIENTIFIC NAME RENDER & SEARCH */}
                      <div className="mt-1">
                        {isEditingSpecies ? (
                          <div className="flex flex-col gap-3 mt-3 bg-gray-50 dark:bg-stone-700/30 p-4 rounded-xl border border-gray-200 dark:border-stone-600">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Search correct species..."
                                value={speciesSearchQuery}
                                onChange={(e) => setSpeciesSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSpecies()}
                                className="flex-1 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline- text-sm shadow-sm"
                                autoFocus
                              />
                              <button
                                onClick={handleSearchSpecies}
                                disabled={isSearchingSpecies}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
                              >
                                {isSearchingSpecies ? "..." : "Search"}
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingSpecies(false);
                                  setSpeciesSearchResults([]);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 px-2 text-lg cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Search Results Dropdown */}
                            {speciesSearchResults.length > 0 && (
                              <div className="max-h-48 overflow-y-auto mt-2 flex flex-col gap-2 pr-1">
                                <p className="text-xs text-gray-500 dark:text-stone-400 font-semibold uppercase tracking-wider mb-1">Select best match:</p>
                                {speciesSearchResults.map((match) => (
                                  <div
                                    key={match.id}
                                    onClick={() => handleSelectSpeciesMatch(match)}
                                    className="p-3 bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer rounded-lg border border-gray-100 dark:border-stone-700 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all shadow-sm flex flex-col"
                                  >
                                    <span className="font-bold text-gray-900 dark:text-white capitalize">
                                      {match.common_name}
                                    </span>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                                      {Array.isArray(match.scientific_name) ? match.scientific_name[0] : match.scientific_name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2 group/species cursor-pointer w-fit mt-1"
                            onClick={() => {
                              setIsEditingSpecies(true);
                              setSpeciesSearchQuery(selectedPlant.species || selectedPlant.scientific_name || "");
                            }}
                          >
                            {(selectedPlant.scientific_name || selectedPlant.species) ? (
                              <p className="text-emerald-600 dark:text-emerald-400 text-md font-medium italic group-hover/species:underline decoration-emerald-400/50 underline-offset-4">
                                {selectedPlant.scientific_name || selectedPlant.species}
                              </p>
                            ) : (
                              <p className="text-gray-400 text-sm italic group-hover/species:text-emerald-500 transition-colors">
                                Add species information
                              </p>
                            )}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600/50 dark:text-emerald-400/50 group-hover/species:text-emerald-600 dark:group-hover/species:text-emerald-400 transition-colors">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-500 dark:text-stone-400 mt-2 text-sm font-normal">
                        Added on {new Date(selectedPlant.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPlant(null)}
                  className="hidden md:block text-gray-400 hover:text-gray-600 dark:hover:text-stone-200 text-2xl leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-50 dark:bg-stone-700/50 rounded-xl border border-gray-100 dark:border-stone-700">
                  <p className="text-sm text-gray-500 dark:text-stone-400">Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedPlant.success_rate}%</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-stone-700/50 rounded-xl border border-gray-100 dark:border-stone-700">
                  <p className="text-sm text-gray-500 dark:text-stone-400">Time Propagating</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-stone-200">{getDaysActive(selectedPlant.created_at)} Days</p>
                </div>
              </div>

              {/* FIXED: Modal Data Tags updated for Trefle */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPlant.sunlight && (
                  <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm">
                    ☀️ {selectedPlant.sunlight}
                  </span>
                )}

                {selectedPlant.toxicity && selectedPlant.toxicity !== "none" && (
                  <span className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm border gap-1">
                    ⚠️ Toxic: {selectedPlant.toxicity}
                  </span>
                )}
                {selectedPlant.toxicity === "none" && (
                  <span className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm border gap-1">
                    ✅ Non-Toxic
                  </span>
                )}

                {selectedPlant.edible && (
                  <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-3 py-1 rounded-lg font-medium flex items-center text-sm shadow-sm">
                    🍽️ Edible
                  </span>
                )}
              </div>

              {/* Expert Care Card */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-3">
                  Propagation Care Rules
                </h4>
                <ul className="text-sm space-y-3 text-gray-700 dark:text-stone-300">
                  <li className="flex gap-3 items-start">
                    <span className="text-lg leading-none">💧</span>
                    <span>Monitor water levels daily. Ensure the container is consistently filled so the node remains fully submerged.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-lg leading-none">🪴</span>
                    <span>This cutting is ready for soil transfer once the roots are at least <strong>1 inch</strong> in length.</span>
                  </li>
                </ul>
              </div>

              {/* Feedback Loop */}
              {getDaysActive(selectedPlant.created_at) >= 7 ? (
                <div className="mb-auto p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                    📅 Weekly Check-in
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                    It's been over a week! Has this cutting formed any roots yet?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleFeedback(true)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer text-sm"
                    >
                      Yes, roots! 🌱
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className="flex-1 py-2 bg-white dark:bg-stone-800 border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 rounded-lg font-medium transition-colors cursor-pointer text-sm"
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-auto p-4 border border-dashed border-gray-200 dark:border-stone-700 rounded-xl text-center">
                  <p className="text-gray-400 dark:text-stone-500 text-sm">
                    Check back on {new Date(new Date(selectedPlant.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} to record your results.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-stone-700 flex justify-between items-center">
                <span className="text-xs text-gray-400">ID: {selectedPlant.id.slice(0, 8)}...</span>

                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">🗑️</span> Remove Plant
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
