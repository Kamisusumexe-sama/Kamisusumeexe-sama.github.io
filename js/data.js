// =============================================
//  PORTFOLIO DATA — edit this file to update
//  your portfolio content without touching HTML
// =============================================

const PORTFOLIO_DATA = {

  // --- Personal Info ---
  name: "Your Name",
  tagline: "Game Developer · Designer · World Builder",
  heroBio: "Hi, I'm Your Name",
  aboutBio: "Hey there! I'm a game developer who loves crafting immersive worlds and memorable characters. From pixel art platformers to 3D narrative adventures — I build games that feel alive.",
  aboutBody: "I specialize in Unity and Godot, with a strong eye for game feel, UI/UX, and storytelling. I believe games are the most powerful art form — and I'm here to prove it.",
  contactText: "Looking for a game developer for your next project? Interested in collaborating on a jam? Just want to talk games? My inbox is always open!",

  stats: {
    gamesShipped: 12,
    yearsXP: 5,
    gameJamsWon: 3,
  },

  // --- Social Links ---
  links: {
    email: "mailto:you@email.com",
    twitter: "https://twitter.com/yourhandle",
    itchio: "https://yourname.itch.io",
    github: "https://github.com/yourname",
    linkedin: "https://linkedin.com/in/yourname",
  },

  // --- Skills (0–100) ---
  skills: [
    { name: "Unity / C#",           level: 90 },
    { name: "Godot / GDScript",     level: 80 },
    { name: "Pixel Art / Aseprite", level: 85 },
    { name: "Game Design",          level: 92 },
    { name: "HTML5 / Web Games",    level: 75 },
  ],

  // --- Projects ---
  // type: "game" | "project"
  // image: path to image or "" for placeholder
  // playUrl: set to a .html path or itch.io link to show Play button
  // videoUrl: YouTube embed URL (optional)
  projects: [
    {
      id: "proj1",
      title: "Starfall Chronicles",
      description: "A narrative pixel-art RPG about a star that fell to earth. Built in Godot in 3 months.",
      tags: ["Godot", "Pixel Art", "RPG"],
      image: "",
      playUrl: "https://yourname.itch.io/starfall",
      videoUrl: "",
      featured: true,
    },
    {
      id: "proj2",
      title: "BunnyBlast",
      description: "A frantic multiplayer party game. 72hr game jam entry — placed 2nd overall.",
      tags: ["Unity", "C#", "Multiplayer"],
      image: "",
      playUrl: "games/bunnyblast/index.html",
      videoUrl: "",
      featured: true,
    },
    {
      id: "proj3",
      title: "Echoes of Nova",
      description: "A 3D atmospheric horror platformer. Solo project, 6 months development.",
      tags: ["Unity", "3D", "Horror"],
      image: "",
      playUrl: "",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      featured: false,
    },
  ],

  // --- Playable Web Games ---
  // embedUrl: a relative path like "games/mygame/index.html"
  //           OR an itch.io iframe URL
  webGames: [
    {
      id: "game1",
      title: "BunnyBlast",
      description: "Frantic multiplayer party game",
      image: "",
      embedUrl: "games/bunnyblast/index.html",
    },
    {
      id: "game2",
      title: "Pixel Jumper",
      description: "A classic auto-runner",
      image: "",
      embedUrl: "games/pixeljumper/index.html",
    },
  ],

  // --- Videos / Showreel ---
  // type: "youtube" | "vimeo" | "local"
  // src: YouTube embed URL, Vimeo embed URL, or path to .mp4
  videos: [
    {
      id: "vid1",
      title: "2024 Showreel",
      type: "youtube",
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumb: "",
    },
    {
      id: "vid2",
      title: "Starfall Chronicles — Trailer",
      type: "youtube",
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumb: "",
    },
  ],

};
