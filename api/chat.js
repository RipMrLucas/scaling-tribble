// Vercel Edge Function — streams chat completions from NVIDIA NIM
// straight through to the browser, key stays server-side.
// Path: api/chat.js  →  https://your-project.vercel.app/api/chat

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const allowedOrigin = "https://ripmrlucas.github.io";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const nimRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NIM_API_KEY}`,
        "Accept": "text/event-stream",
      },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!nimRes.ok || !nimRes.body) {
      const errText = await nimRes.text();
      return new Response(JSON.stringify({ error: `NIM error ${nimRes.status}: ${errText}` }), {
        status: nimRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pipe the SSE stream straight through to the browser
    return new Response(nimRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
