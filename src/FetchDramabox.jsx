import { useEffect, useState, useCallback, useRef } from "react";
import MovieSlider from "./components/MovieSlider";
import MovieCard from "./components/MovieCard";
import VideoPlayer from "./components/videoPlayer";

// Hardcoded daftar genre untuk ilustrasi
const GENRES = [
  { id: null, name: "Semua Film" },
  { id: 1357, name: "Romance" },
  { id: 1358, name: "Action" },
  { id: 1359, name: "Fantasy" },
  { id: 1360, name: "Drama" },
];

// Helper: Fungsi Debounce (untuk menghindari terlalu banyak panggilan API)
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

export default function FetchDramabox() {
  const [allData, setAllData] = useState([]);
  const [topRanks, setTopRanks] = useState([]);
  const [currentGenre, setCurrentGenre] = useState(GENRES[0]);
  const [genreData, setGenreData] = useState([]); // Menggantikan state 'filtered' lama
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // STATE UNTUK KONTROL PLAYER MODAL UTAMA
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);

  const [videoUrl, setVideoUrl] = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // State untuk Loading
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchContainerRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // =========================================================
  // FUNGSI INTI: Fetch URL Video dan Mainkan (Diperbaiki)
  // =========================================================
  const fetchAndPlayChapter = useCallback(
    async (bookId, chapterIndex, chapterDisplayName, bookName) => {
      setCurrentChapterIndex(chapterIndex);
      setVideoUrl(null);

      try {
        const watchUrl = `/api-dramabox/api/watch/${bookId}/${chapterIndex}?lang=in&source=chapter_list`;
        const response = await fetch(watchUrl);
        const json = await response.json();
        const url = json?.data?.videoUrl;

        if (url) {
          setVideoUrl(url);
          // Menggunakan bookName dan chapterDisplayName dari argumen
          setVideoTitle(`${bookName} - ${chapterDisplayName}`);
        } else {
          alert("Gagal mendapatkan URL streaming untuk episode ini.");
        }
      } catch (error) {
        console.error("Error fetching watch URL:", error);
        alert("Terjadi kesalahan saat mengambil data streaming.");
      }
    },
    []
  );

  // =========================================================
  // FUNGSI UTAMA: Klik Kartu (Picu Modal)
  // =========================================================
  const handleCardClick = async (movie) => {
    setSelectedMovie(movie);
    setChapters([]);
    setIsChaptersLoading(true);
    setIsPlayerModalOpen(true);
    setVideoUrl(null);

    // 1. Fetch daftar episode
    const chaptersUrl = `/api-dramabox/api/chapters/${movie.bookId}?lang=in`;
    try {
      const response = await fetch(chaptersUrl);
      const json = await response.json();
      const chapterList = json?.data?.chapterList || [];
      setChapters(chapterList);

      // 2. Otomatis mainkan episode pertama (index 0) jika ada
      if (chapterList.length > 0) {
        const chapterDisplayName = `Episode 1`;
        // Kirim movie.bookName sebagai argumen
        fetchAndPlayChapter(
          movie.bookId,
          0,
          chapterDisplayName,
          movie.bookName
        );
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
    } finally {
      setIsChaptersLoading(false);
    }
  };

  const fetchGenreData = useCallback(
    async (genreId, pageNo = 1) => {
      setIsFiltering(true);
      let endpoint;
      let newData = [];

      if (genreId === null) {
        newData = allData;
      } else {
        endpoint = `/api-dramabox/api/classify?lang=in&pageNo=${pageNo}&genre=${genreId}&sort=1`;

        try {
          const response = await fetch(endpoint);
          const json = await response.json();
          newData = json?.data?.list || [];
        } catch (error) {
          console.error("Error fetching genre data:", error);
          newData = [];
        }
      }

      if (pageNo === 1) {
        setGenreData(newData);
      } else {
        setGenreData((prev) => [...prev, ...newData]);
      }

      setIsFiltering(false);
    },
    [allData]
  );

  const handleGenreChange = (genre) => {
    setSearch("");
    setSuggestions([]);
    setCurrentGenre(genre);
    setPage(1);
    fetchGenreData(genre.id, 1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);

    if (search === "") {
      fetchGenreData(currentGenre.id, nextPage);
    }
  };

  const fetchSuggestions = useCallback(async (keyword) => {
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }
    const endpoint = `/api-dramabox/api/suggest/${keyword}?lang=in`;

    try {
      const response = await fetch(endpoint);
      const json = await response.json();
      setSuggestions(json?.data?.suggestList || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, 300),
    [fetchSuggestions]
  );

  const fetchSearchData = useCallback(async (keyword, pageNo = 1) => {
    if (!keyword) return;

    setIsSearching(true);
    const endpoint = `/api-dramabox/api/search/${keyword}/${pageNo}?lang=in`;

    try {
      const response = await fetch(endpoint);
      const json = await response.json();
      const newData = json?.data?.list || [];

      if (pageNo === 1) {
        setGenreData(newData);
      } else {
        setGenreData((prev) => [...prev, ...newData]);
      }
    } catch (error) {
      console.error("Error fetching search data:", error);
    }
    setIsSearching(false);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);

    debouncedFetchSuggestions(value);

    if (value.length > 2) {
      fetchSearchData(value, 1);
    } else if (value.length === 0) {
      setSuggestions([]);
      fetchGenreData(currentGenre.id, 1);
    } else {
      setGenreData([]);
    }
  };

  const handleSuggestionClick = (keyword) => {
    setSearch(keyword);
    setSuggestions([]);
    setPage(1);
    fetchSearchData(keyword, 1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      const forYouPromise = fetch("/api-dramabox/api/foryou/1?lang=in")
        .then((res) => res.json())
        .then((json) => {
          const movies = json?.data?.list || [];
          setAllData(movies);
          setGenreData(movies);
        })
        .catch((err) => console.error("Error fetching foryou:", err));

      const topRanksPromise = fetch("/api-dramabox/api/rank/1?lang=in")
        .then((res) => res.json())
        .then((json) => {
          setTopRanks(json?.data?.list || []);
        })
        .catch((err) => console.error("Error fetching top ranks:", err));

      await Promise.all([forYouPromise, topRanksPromise]);
      setLoading(false);
    };

    fetchInitialData();
  }, []);

  const visibleItems = genreData.slice(0, page * itemsPerPage);
  // Menggunakan genreData.length (bisa hasil filter atau genre)
  const remainingItems = genreData.length - visibleItems.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-5 md:p-10">
      <h1 className="mb-8 text-4xl font-extrabold tracking-wider text-red-500">
        DRAMABOX
      </h1>

      {/* SEARCH BAR & AUTOCOMPLETE */}
      <div className="relative mb-8 z-40" ref={searchContainerRef}>
        <input
          type="text"
          placeholder="Cari film, serial..."
          value={search}
          onFocus={() => {
            if (search.length > 1) debouncedFetchSuggestions(search);
          }}
          onChange={handleSearchChange}
          className={`
            w-full p-4 pl-12 bg-gray-800 text-white border border-gray-700 shadow-xl focus:outline-none focus:border-red-500 transition-all duration-300
            ${
              suggestions.length > 0 && search.length > 1
                ? "rounded-t-full rounded-b-none"
                : "rounded-full"
            }
          `}
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>

        {/* Saran Autocomplete */}
        {suggestions.length > 0 && search.length > 1 && (
          <div className="absolute w-full bg-gray-800 border border-t-0 border-gray-700 rounded-b-xl shadow-2xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.bookName)}
                className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors duration-150 border-b border-gray-700 last:border-b-0 truncate"
              >
                {suggestion.bookName}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="text-center py-10 text-lg">Loading...</p>}

      {!loading && (
        <>
          {/* SLIDER 1: Rekomendasi Terbaik */}
          <MovieSlider
            title="Rekomendasi Terbaik"
            items={allData.slice(0, 10)}
            onCardClick={handleCardClick}
          />

          {/* SLIDER 2: Ranking Tertinggi */}
          {topRanks.length > 0 && (
            <MovieSlider
              title="Ranking Tertinggi 🏆"
              items={topRanks}
              onCardClick={handleCardClick}
            />
          )}

          {/* Judul "Semua Film" dan Genre Filter */}
          <h2 className="mt-12 mb-4 text-3xl font-bold border-l-4 border-red-500 pl-3">
            {search
              ? `Hasil Pencarian untuk "${search}"`
              : `Film Berdasarkan Genre: ${currentGenre.name}`}
          </h2>

          {/* FILTER BUTTONS */}
          {!search && (
            <div className="flex flex-wrap gap-3 mb-6">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreChange(genre)}
                  disabled={isFiltering}
                  className={`
                    px-4 py-2 rounded-full font-medium transition-colors duration-200
                    ${
                      currentGenre.id === genre.id
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }
                  `}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}

          {/* CARD GRID */}
          {(isFiltering || isSearching) && page === 1 ? (
            <p className="text-center py-10 text-lg">Memuat data...</p>
          ) : visibleItems.length === 0 ? (
            <p className="text-center py-10 text-lg">Film tidak ditemukan.</p>
          ) : (
            <div
              className="
                grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 
              "
            >
              {visibleItems.map((item, index) => (
                <MovieCard key={index} item={item} onClick={handleCardClick} />
              ))}
            </div>
          )}

          {/* LOAD MORE BUTTON */}
          {remainingItems > 0 && (
            <button
              onClick={handleLoadMore}
              disabled={isFiltering || isSearching}
              className="
                mt-8 w-full py-3 rounded-full bg-red-600 text-white font-semibold text-lg border-none cursor-pointer shadow-lg shadow-red-600/50 hover:bg-red-700 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-wait
              "
            >
              {isFiltering || isSearching
                ? "Memuat..."
                : `Tampilkan Lebih Banyak (${remainingItems} Tersisa)`}
            </button>
          )}
        </>
      )}

      {/* MODAL PLAYER & DAFTAR EPISODE */}
      {isPlayerModalOpen && selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4 md:p-10 overflow-y-auto pt-16">
          {/* Tombol Tutup */}
          <button
            onClick={() => {
              setIsPlayerModalOpen(false);
              setChapters([]);
              setSelectedMovie(null);
              setVideoUrl(null);
            }}
            className="absolute top-2 right-2 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center z-[60] rounded-full text-2xl font-bold shadow-lg transition-colors bg-gray-700 text-white hover:bg-red-500"
            aria-label="Tutup Pemutar Video dan Daftar Episode"
          >
            &times;
          </button>

          {/* Container Grid (Player Kiri, List Kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full max-h-[90vh] lg:max-h-[90vh]">
            {/* KOLOM KIRI: VIDEO PLAYER (2/3 lebar di desktop) */}
            <div className="lg:col-span-2">
              {videoUrl ? (
                <div className="w-full h-full">
                  <VideoPlayer
                    url={videoUrl}
                    title={videoTitle}
                    onClose={() => {}}
                  />
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl shadow-2xl h-full flex items-center justify-center min-h-[400px]">
                  <p className="text-xl text-red-500">Memuat Video...</p>
                </div>
              )}
            </div>

            {/* KOLOM KANAN: DAFTAR EPISODE (1/3 lebar di desktop) */}
            <div className="lg:col-span-1 bg-gray-800 rounded-xl shadow-2xl p-4 lg:p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-red-500 border-b border-gray-700 pb-2 truncate">
                Episode: {selectedMovie.bookName}
              </h3>

              {isChaptersLoading ? (
                <p className="text-center py-4">Memuat daftar episode...</p>
              ) : chapters.length === 0 ? (
                <p className="text-center py-4 text-gray-400">
                  Daftar episode tidak ditemukan.
                </p>
              ) : (
                <ul className="space-y-3">
                  {chapters.map((chapter, index) => {
                    // Buat nama episode berdasarkan indeks
                    const chapterDisplayName = `Episode ${index + 1}`;
                    return (
                      <li key={index}>
                        <button
                          // Panggil dengan chapterDisplayName dan bookName yang aman
                          onClick={() =>
                            fetchAndPlayChapter(
                              selectedMovie.bookId,
                              index,
                              chapterDisplayName,
                              selectedMovie.bookName
                            )
                          }
                          className={`
                              w-full text-left p-3 rounded-lg transition-colors duration-200 shadow-md
                              ${
                                index === currentChapterIndex
                                  ? "bg-red-600 font-bold text-white scale-[1.02]"
                                  : "bg-gray-700 hover:bg-gray-600"
                              }
                            `}
                        >
                          <span className="font-semibold">
                            {chapterDisplayName}
                          </span>
                          {index === currentChapterIndex && (
                            <span className="float-right text-xs bg-black/30 px-2 py-0.5 rounded-full">
                              DIPUTAR
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
