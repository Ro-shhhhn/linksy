export default function UrlCard({ shortUrl }) {
  return (
    <div className="mt-4 p-3 border rounded-lg bg-gray-50 text-center">
      <p className="text-sm text-gray-600">Your short link:</p>
      <a
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 font-medium"
      >
        {shortUrl}
      </a>
    </div>
  );
}
