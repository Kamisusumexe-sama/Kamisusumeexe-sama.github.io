const { getStore } = require("@netlify/blobs");

const store = getStore("portfolio");
const DATA_KEY = "data";

const defaultData = {
  name: "Your Name",
  tagline: "Game Developer · Designer · World Builder",
  heroBio: "Hi, I'm Your Name",
  aboutBio: "",
  aboutBody: "",
  contactText: "",
  stats: {
    gamesShipped: 0,
    yearsXP: 0,
    gameJamsWon: 0
  },
  links: {
    email: "",
    twitter: "",
    itchio: "",
    github: "",
    linkedin: ""
  },
  skills: [],
  projects: [],
  webGames: [],
  videos: []
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, { ok: true });
  }

  if (event.httpMethod === "GET") {
    const saved = await store.get(DATA_KEY, { type: "json" });
    return response(200, saved || defaultData);
  }

  if (event.httpMethod === "POST") {
    const expectedKey = process.env.ADMIN_API_KEY;
    const providedKey =
      event.headers["x-admin-key"] || event.headers["X-Admin-Key"];

    if (!expectedKey || providedKey !== expectedKey) {
      return response(401, { ok: false, error: "Unauthorized" });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch (error) {
      return response(400, { ok: false, error: "Invalid JSON payload" });
    }

    if (!payload || typeof payload !== "object") {
      return response(400, { ok: false, error: "Payload must be an object" });
    }

    await store.setJSON(DATA_KEY, payload);
    return response(200, { ok: true });
  }

  return response(405, { ok: false, error: "Method not allowed" });
};
