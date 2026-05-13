import { useEffect, useState } from "react";
import { getNasaImages } from "../services/nasaImages";

function ImageGallery({ query }) {
  const [images, setImages] = useState([]);
  const [mode, setMode] = useState("default");

  // Pagination
  const [page, setPage] = useState(1);
  const IMAGES_PER_PAGE = 6;

  const start = (page - 1) * IMAGES_PER_PAGE;
  const end = start + IMAGES_PER_PAGE;
  const visibleImages = images.slice(start, end);

  async function load() {
    try {
      const items = await getNasaImages(query, mode);
      setImages(items);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!query) return;
    setPage(1); 
    load();
  }, [query, mode]);

  if (!query) return null;

  return (
    <div className="image-gallery">
      <h3>NASA Images: {query}</h3>

      {/* Toggle Buttons */}
      <div className="gallery-toggle-row">
        <button
          className={mode === "orbital" ? "active" : ""}
          onClick={() => setMode("orbital")}
        >
          Orbital
        </button>
        <button
          className={mode === "surface" ? "active" : ""}
          onClick={() => setMode("surface")}
        >
          Surface
        </button>
        <button
          className={mode === "default" ? "active" : ""}
          onClick={() => setMode("default")}
        >
          All
        </button>
      </div>

      {/* Image Grid */}
      <div className="image-grid">
        {visibleImages.map((item) => {
          const link = item.links?.[0];
          if (!link) return null;
          return (
            <img
              key={item.data?.[0]?.nasa_id}
              src={link.href}
              alt={item.data?.[0]?.title || query}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {images.length > 0 && (
        <div className="pagination">
          {Array.from({ length: Math.ceil(images.length / IMAGES_PER_PAGE) }).map(
            (_, i) => (
              <button
                key={i}
                className={page === i + 1 ? "active" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
