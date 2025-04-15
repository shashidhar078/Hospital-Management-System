import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { searchMedicines } from "./genaiApi";

const GenAiSearch = () => {
  const { query } = useParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const res = await searchMedicines(query);

      if (res.success) {
        setResults(res.results);
      } else {
        setError(res.message || "Something went wrong");
      }
      setLoading(false);
    };

    getData();
  }, [query]);

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-cyan-100 to-blue-200">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Search Results for: <span className="text-blue-600">{query}</span>
        </h2>

        {loading && <p className="text-lg text-gray-500">Fetching medicine details...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {results && results.length > 0 && (
          <div className="space-y-6">
            {results.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="text-xl font-semibold text-blue-700">{item.medicine}</h3>
                <p className="text-gray-700"><strong>Description:</strong> {item.description}</p>
                <p><strong>Side Effects:</strong> {item.sideEffects?.join(", ") || "N/A"}</p>
                <p><strong>Precautions:</strong> {item.precautions?.join(", ") || "N/A"}</p>
                <p><strong>Remedies:</strong> {item.remedies?.join(", ") || "N/A"}</p>
                <p><strong>Dosage:</strong> {item.dosage || "Not mentioned"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenAiSearch;
