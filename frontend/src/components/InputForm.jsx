import { useState } from "react";
import API from "../services/api";
import UrlCard from "./UrlCard";

export default function InputForm() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState(null);
  const [isShortened, setIsShortened] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await API.post("/shorten", { longUrl });
      setShortUrl(res.data.shortUrl);
      setIsShortened(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error shortening URL";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNewLink = () => {
    setLongUrl("");
    setShortUrl(null);
    setIsShortened(false);
    setError("");
  };

  const handleInputChange = (e) => {
    setLongUrl(e.target.value);
    if (error) setError(""); // Clear error when user starts typing
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={longUrl}
            onChange={handleInputChange}
            placeholder="Enter URL (e.g., example.com)"
            className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
              error 
                ? 'border-red-300 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-200'
            }`}
            disabled={isShortened || loading}
          />
          {!isShortened ? (
            <button
              type="submit"
              disabled={loading || !longUrl.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "..." : "Shorten"}
            </button>
          ) : (
            <button
              type="button"
              className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-default"
              disabled
            >
              ✓
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
      </form>

      {shortUrl && <UrlCard shortUrl={shortUrl} />}

      {isShortened && (
        <div className="mt-4 text-center">
          <button
            onClick={handleNewLink}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Shorten New Link
          </button>
        </div>
      )}
    </div>
  );
}