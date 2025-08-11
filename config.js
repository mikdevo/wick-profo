window.PROFILE_CONFIG = {
  site: {
    backgroundImage: "./assets/background.png",
    animatedBackground: {
      enabled: true,
      type: "blobs",
      blobs: 5,
      speed: 28
    },
    theme: {
      primary: "#6c5ce7",
      accent: "#00d1ff",
      text: "#f6f7fb",
      muted: "#cfd3e3",
    },
  },
  user: {
    displayName: "Wick",
    avatar: "./assets/avatar.png",
    banner: "./assets/banner.jpg",
    roles: [
      "CyberSecurity",
      "Developer",
      "Bug Hunter",
      "AI Enthusiast",
    ],
  },
  roles: {
    CyberSecurity: '<i class="fas fa-shield-halved"></i>',
    Developer: '<i class="fas fa-code"></i>',
    "Bug Hunter": '<i class="fas fa-bug"></i>',
    "AI Enthusiast": '<i class="fas fa-brain"></i>',
  },
  dynamic: {
    discord: {
      enabled: true,
      userId: "204221589883977728",
      sourcePriority: ["japi", "lanyard"],
      refreshMs: 10000,
      overrideDisplayName: true,
      imageSizes: { avatar: 512, banner: 2048 },
    },
  },
  socials: [
    { name: "Discord", url: "https://discord.com/users/204221589883977728", icon: "discord" },
    { name: "GitHub", url: "https://github.com/wickstudio", icon: "github" },
    { name: "YouTube", url: "https://www.youtube.com/@wick_studio", icon: "youtube" },
    { name: "Steam", url: "https://steamcommunity.com/profiles/76561199409255940", icon: "steam" },
    { name: "Instagram", url: "https://www.instagram.com/wicknux/", icon: "instagram" },
    { name: "Telegram", url: "https://t.me/wicknux", icon: "telegram" },
    { name: "Spotify", url: "https://open.spotify.com/user/u649qsqyj5lebvo763ai6z56t", icon: "spotify" },
  ],
};