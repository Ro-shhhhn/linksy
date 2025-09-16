import { useState } from "react";
import API from "../services/api";
import UrlCard from "./UrlCard";

export default function InputForm() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    try {
      const res = await API.post("/shorten", { longUrl });
      setShortUrl(res.data.shortUrl);
    } catch (err) {
      alert("Error shortening URL");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          placeholder="Enter your long URL"
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Shorten
        </button>
      </form>

      {shortUrl && <UrlCard shortUrl={shortUrl} />}
    </div>
  );
}
