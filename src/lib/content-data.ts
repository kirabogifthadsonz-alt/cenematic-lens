export interface Title {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  genre: string;
  language: string;
  year: number;
  duration: string;
  rating: string;
  isFree: boolean;
  isVJ: boolean;
  category: string[];
  cast?: string[];
}

const VIDEOS = [
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
];

export const titles: Title[] = [
  { id: "1", title: "Sanyu The Surprise", description: "A heartwarming Ugandan drama about family, love and unexpected turns.", thumbnail: "", videoUrl: VIDEOS[0], genre: "Drama", language: "Luganda", year: 2025, duration: "1h 45m", rating: "PG-13", isFree: false, isVJ: false, category: ["trending", "movies", "luganda"] },
  { id: "2", title: "Kayikuuzi", description: "An action-packed Ugandan thriller set in Kampala's streets.", thumbnail: "", videoUrl: VIDEOS[1], genre: "Action", language: "Luganda", year: 2025, duration: "2h 10m", rating: "R", isFree: false, isVJ: false, category: ["trending", "movies", "luganda"] },
  { id: "3", title: "The Surprise", description: "A comedic tale of mistaken identity in rural Uganda.", thumbnail: "", videoUrl: VIDEOS[2], genre: "Comedy", language: "English", year: 2024, duration: "1h 30m", rating: "PG", isFree: false, isVJ: false, category: ["movies", "new"] },
  { id: "4", title: "Queen of the Pearl", description: "Inspired by true events – a young chess prodigy from Katwe.", thumbnail: "", videoUrl: VIDEOS[0], genre: "Drama", language: "English", year: 2025, duration: "2h 5m", rating: "PG", isFree: false, isVJ: false, category: ["trending", "movies", "originals"] },
  { id: "5", title: "VJ Emmy Mix 2025", description: "The hottest VJ Emmy compilation of 2025 – narrated comedy gold.", thumbnail: "", videoUrl: VIDEOS[1], genre: "VJ Mix", language: "Luganda", year: 2025, duration: "3h 20m", rating: "PG-13", isFree: false, isVJ: true, category: ["trending", "vjs", "luganda"] },
  { id: "6", title: "NBS VJ Session Vol. 1", description: "Live VJ session recorded at NBS Television studios.", thumbnail: "", videoUrl: VIDEOS[2], genre: "VJ Session", language: "Luganda", year: 2025, duration: "2h 45m", rating: "PG-13", isFree: false, isVJ: true, category: ["vjs"] },
  { id: "7", title: "Galaxy VJ Top 10", description: "Galaxy FM presents the top 10 VJ moments of the year.", thumbnail: "", videoUrl: VIDEOS[0], genre: "VJ Mix", language: "Luganda", year: 2025, duration: "1h 55m", rating: "PG", isFree: false, isVJ: true, category: ["vjs", "trending"] },
  { id: "8", title: "Kampala Nights", description: "A Cinematic Lens Original exploring Kampala's vibrant nightlife.", thumbnail: "", videoUrl: VIDEOS[1], genre: "Documentary", language: "English", year: 2025, duration: "1h 20m", rating: "PG-13", isFree: false, isVJ: false, category: ["originals", "new"] },
  { id: "9", title: "Boda Boda Dreams", description: "A coming-of-age story of a boda boda rider chasing his dreams.", thumbnail: "", videoUrl: VIDEOS[2], genre: "Drama", language: "Luganda", year: 2024, duration: "1h 50m", rating: "PG-13", isFree: false, isVJ: false, category: ["movies", "luganda"] },
  { id: "10", title: "Ugandan Music Video Hits", description: "Top Ugandan music videos curated by VJ culture.", thumbnail: "", videoUrl: VIDEOS[0], genre: "Music", language: "Luganda", year: 2025, duration: "1h 10m", rating: "PG", isFree: true, isVJ: true, category: ["vjs", "kids"] },
  { id: "11", title: "Nollywood Kings", description: "Nigerian blockbuster action drama.", thumbnail: "", videoUrl: VIDEOS[1], genre: "Action", language: "English", year: 2024, duration: "2h 15m", rating: "R", isFree: false, isVJ: false, category: ["nollywood", "movies"] },
  { id: "12", title: "Lagos Love Story", description: "A romantic Nollywood classic.", thumbnail: "", videoUrl: VIDEOS[2], genre: "Romance", language: "English", year: 2025, duration: "1h 40m", rating: "PG-13", isFree: false, isVJ: false, category: ["nollywood", "new"] },
  { id: "13", title: "VJ Jingo Live", description: "VJ Jingo's legendary live commentary session.", thumbnail: "", videoUrl: VIDEOS[0], genre: "VJ Session", language: "Luganda", year: 2025, duration: "2h 30m", rating: "PG-13", isFree: false, isVJ: true, category: ["vjs"] },
  { id: "14", title: "Katoto Adventures", description: "Fun animated adventures for Ugandan kids.", thumbnail: "", videoUrl: VIDEOS[1], genre: "Animation", language: "English", year: 2025, duration: "45m", rating: "G", isFree: true, isVJ: false, category: ["kids"] },
  { id: "15", title: "Safari Tales", description: "Explore Uganda's wildlife through stunning cinematography.", thumbnail: "", videoUrl: VIDEOS[2], genre: "Documentary", language: "English", year: 2024, duration: "1h 15m", rating: "G", isFree: true, isVJ: false, category: ["kids", "originals"] },
  { id: "16", title: "Matooke Republic", description: "A satirical comedy about Ugandan politics.", thumbnail: "", videoUrl: VIDEOS[0], genre: "Comedy", language: "Luganda", year: 2025, duration: "1h 35m", rating: "PG-13", isFree: false, isVJ: false, category: ["trending", "movies", "luganda", "new"] },
  { id: "17", title: "VJ Mix: Nollywood Edition", description: "VJ-narrated Nollywood hits compilation.", thumbnail: "", videoUrl: VIDEOS[1], genre: "VJ Mix", language: "Luganda", year: 2025, duration: "2h 50m", rating: "PG-13", isFree: false, isVJ: true, category: ["vjs", "nollywood"] },
  { id: "18", title: "The Last Warrior", description: "An epic Ugandan historical drama.", thumbnail: "", videoUrl: VIDEOS[2], genre: "Action", language: "English", year: 2025, duration: "2h 20m", rating: "R", isFree: false, isVJ: false, category: ["movies", "originals", "new"] },
  { id: "19", title: "Rolex & Chips", description: "A food documentary exploring Uganda's street food culture.", thumbnail: "", videoUrl: VIDEOS[0], genre: "Documentary", language: "English", year: 2025, duration: "55m", rating: "G", isFree: true, isVJ: false, category: ["originals", "trending"] },
  { id: "20", title: "Club Guvnor Sessions", description: "Live DJ and VJ sessions from Kampala's iconic Club Guvnor.", thumbnail: "", videoUrl: VIDEOS[1], genre: "Music", language: "Luganda", year: 2025, duration: "1h 45m", rating: "PG-13", isFree: false, isVJ: true, category: ["vjs", "new"] },
];

export const getByCategory = (cat: string) => titles.filter(t => t.category.includes(cat));
export const getById = (id: string) => titles.find(t => t.id === id);
export const getVJ = () => titles.filter(t => t.isVJ);
export const getFree = () => titles.filter(t => t.isFree);
