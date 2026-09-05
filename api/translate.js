// Vercel Serverless Function — proxies requests to NVIDIA NIM so your
// API key never touches the browser. This file's path IS its URL:
// api/translate.js  →  https://your-project.vercel.app/api/translate

export default async function handler(req, res) {
  // Locked to Lucas's real GitHub Pages URL.
  const allowedOrigin = "https://ripmrlucas.github.io";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const nimRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // NIM_API_KEY lives in Vercel's Environment Variables — never
        // shipped to the browser, meow.
        "Authorization": `Bearer ${process.env.NIM_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await nimRes.text();
    res.status(nimRes.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
