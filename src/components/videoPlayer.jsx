export default function VideoPlayer({ url, onClose, title }) {
  return (
    <div className="rounded-xl shadow-2xl max-w-3xl w-full mx-4 lg:mx-auto">
      <div className="relative">
        {title && (
          <div className="mb-4 pt-4 px-4 md:px-6">
            <h3 className="text-xl md:text-2xl font-bold text-white truncate">
              Sedang Diputar: <span className="text-red-500">{title}</span>
            </h3>
          </div>
        )}

        <div
          className="relative w-full overflow-hidden rounded-lg shadow-xl"
          style={{ paddingTop: "70%" }}
        >
          <video
            key={url}
            controls
            autoPlay
            className="absolute top-0 left-0 w-full h-full object-contain"
          >
            <source src={url} type="video/mp4" />
            <p className="p-4 text-center text-gray-400">
              Browser Anda tidak mendukung tag video.
            </p>
          </video>
        </div>
      </div>
    </div>
  );
}
