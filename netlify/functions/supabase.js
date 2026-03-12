// netlify/functions/supabase.js
// This function acts as a secure proxy between the browser and Supabase.
// The SUPABASE_DATABASE_URL and SUPABASE_ANON_KEY environment variables are set
// in Netlify Dashboard → Site Settings → Environment Variables.
// They are NEVER exposed to the browser.

exports.handler = async (event) => {
  const SUPABASE_DATABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "",
    };
  }

  if (!SUPABASE_DATABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Supabase environment variables are not configured. Set SUPABASE_DATABASE_URL and SUPABASE_ANON_KEY in your Netlify dashboard under Site Settings → Environment Variables.",
      }),
    };
  }

  try {
    const { path, method, body, params } = JSON.parse(event.body || "{}");

    if (!path) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required field: path" }),
      };
    }

    const queryString = params ? "?" + new URLSearchParams(params).toString() : "";
    const url = `${SUPABASE_DATABASE_URL}/rest/v1/${path}${queryString}`;

    const fetchOptions = {
      method: method || "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
