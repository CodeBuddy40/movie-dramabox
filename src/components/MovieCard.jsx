export default function MovieCard({ item, onClick }) {
  return (
    <div
      className="w-40 flex-shrink-0 rounded-xl cursor-pointer bg-zinc-900 text-white shadow-lg hover:scale-105 transition-transform duration-300"
      onClick={() => onClick(item)}
    >
      <img
        src={item.cover}
        alt={item.bookName}
        className="w-full h-[200px] object-cover"
      />
      <div className="p-3">
        <h4 className="text-sm font-semibold line-clamp-2">{item.bookName}</h4>

        <p className="text-xs opacity-70 mt-1">
          {" "}
          Telah Ditonton {item.playCount || "Unknown"}
        </p>
      </div>
    </div>
  );
}
