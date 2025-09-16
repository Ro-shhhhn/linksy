import { useState } from "react";

export default function UrlCard({ shortUrl }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="mt-4 p-3 border rounded-lg bg-gray-50">
      <p className="text-sm text-gray-600 text-center mb-2">Your short link:</p>
      <div className="flex items-center gap-2 bg-white rounded-md p-2 border">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 font-medium hover:underline flex-1 break-all text-sm"
        >
          {shortUrl}
        </a>
        <button
          onClick={copyToClipboard}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            copied 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
    </div>
  );
}