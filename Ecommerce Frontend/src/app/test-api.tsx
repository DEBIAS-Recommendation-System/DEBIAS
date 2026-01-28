"use client";
import { useEffect, useState } from "react";

export default function TestAPI() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    console.log("Testing direct fetch...");
    fetch("http://127.0.0.1:8000/categories?page=1&limit=10")
      .then(res => {
        console.log("Response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("Categories data:", data);
        setResult(data);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError(err.message);
      });
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      {error && <div className="text-red-500">Error: {error}</div>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
