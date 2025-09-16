LinkSy – Prime-Length URL Shortener

This is a MERN stack project I made as a task. It shortens URLs in a deterministic way using hashing. The short code length is not fixed but chosen as the smallest prime number greater than the current number of stored links. If there is a collision, it retries with the next prime length.

Backend

Built with Node.js, Express, MongoDB Atlas.

POST /shorten → takes long URL, returns short code.

GET /r/:shortCode → redirects to original URL or 404 if not found.

Same URL always returns the same short code.

Unique index on shortCode ensures no duplicates.

Frontend

 React Vite + Tailwind page.

Input field for long URL and shows the generated short link.

Short link opens in browser and redirects correctly.

Testing

Same URL → same code.

Different URLs → unique codes.

Collisions handled with next prime length.

Invalid codes → 404.

Tested with long URLs and query parameters.
How to Run

Clone the repository.

Go to backend folder:

cd backend
npm install
npm run dev

Create a .env file with:

PORT=5000
MONGO_URI=your-mongodb-uri
FRONTEND_URL=http://localhost:5173

Go to frontend folder:
cd frontend
npm install
npm run dev

Open the frontend in the browser (default: http://localhost:5173).


This project covers deterministic hashing, prime-based short code lengths, and collision handling. 