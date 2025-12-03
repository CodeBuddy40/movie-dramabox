import { useEffect, useRef } from "react";
import MovieCard from "./MovieCard";

// Perbaikan: Tambahkan onCardClick ke props
export default function MovieSlider({ title, items, onCardClick }) {
  // 1. Gunakan useRef untuk mengakses elemen DOM
  const sliderRef = useRef(null);

  // Kecepatan Auto-Scroll (misalnya, setiap 3000ms atau 3 detik)
  const SCROLL_INTERVAL = 3000;

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Fungsi untuk menggeser
    const scroll = () => {
      // Jika sudah mencapai akhir, kembali ke awal
      if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
        slider.scrollLeft = 0; // Kembali ke awal
      } else {
        // Geser sejauh lebar 1 card (misalnya 176px - masih hardcoded, bisa diperbaiki)
        const cardWidth = slider.children[0]?.offsetWidth || 176;
        slider.scrollLeft += cardWidth + 16; // 16 adalah space-x-4
      }
    };

    // Atur interval geser otomatis
    const interval = setInterval(scroll, SCROLL_INTERVAL);

    // Bersihkan interval saat komponen dilepas
    return () => clearInterval(interval);
  }, [items]); // Jalankan ulang saat daftar film berubah

  return (
    <div className="mb-8">
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>

      {/* Tambahkan 'ref' ke elemen yang akan di-scroll */}
      <div
        ref={sliderRef}
        className="
          flex 
          overflow-x-auto 
          whitespace-nowrap 
          scroll-smooth 
          pb-2 
          space-x-4
          scrollbar-hide 
        "
      >
        {items.map((item, index) => (
          // Perbaikan: Meneruskan onCardClick
          <MovieCard key={index} item={item} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}
