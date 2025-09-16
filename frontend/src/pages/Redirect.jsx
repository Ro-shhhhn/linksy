import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Redirect() {
  const { shortCode } = useParams();

  useEffect(() => {
    const checkUrl = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/r/${shortCode}`);
        if (res.data?.longUrl) {
          window.location.href = res.data.longUrl;
        }
      } catch {
        alert("404 - Link not found");
      }
    };
    checkUrl();
  }, [shortCode]);

  return <p>Redirecting...</p>;
}
