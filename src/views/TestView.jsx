import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSocket } from "../context/SocketContext";

const GRID_LENGTH = 10; // Mosaic grid size
const TILE_SIZE = 224 / GRID_LENGTH; // Tile size for 224x128 images

const MosaicTransition = ({ image, onComplete }) => {
  const [removedTiles, setRemovedTiles] = useState([]);

  useEffect(() => {
    let tileIndices = Array.from(
      { length: GRID_LENGTH * GRID_LENGTH },
      (_, i) => i
    );
    tileIndices = tileIndices.sort(() => Math.random() - 0.5);

    tileIndices.forEach((tile, index) => {
      setTimeout(() => {
        setRemovedTiles((prev) => [...prev, tile]);
      }, index * 20);
    });

    const timeout = setTimeout(onComplete, tileIndices.length * 20 + 500);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div
      className="absolute inset-0 grid"
      style={{ gridTemplateColumns: `repeat(${GRID_LENGTH}, 1fr)` }}
    >
      {Array.from({ length: GRID_LENGTH * GRID_LENGTH }, (_, tile) => {
        const x = (tile % GRID_LENGTH) * TILE_SIZE;
        const y = Math.floor(tile / GRID_LENGTH) * TILE_SIZE;

        return (
          <motion.div
            key={tile}
            className="absolute"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundImage: removedTiles.includes(tile)
                ? "none"
                : `url(${image})`,
              backgroundSize: "224px 128px",
              backgroundPosition: `-${x}px -${y}px`,
              top: y,
              left: x,
            }}
            animate={
              removedTiles.includes(tile) ? { opacity: 0 } : { opacity: 1 }
            }
            transition={{ duration: 0.4 }}
          />
        );
      })}
    </div>
  );
};

export const TestView = () => {
  const [images, setImages] = useState([]);
  const [mosaicImage, setMosaicImage] = useState(null);
  const socket = useSocket();
  const backendUrl = import.meta.env.VITE_URL;

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/images`);
        if (!response.ok) throw new Error("Failed to fetch images");
        const data = await response.json();
        setImages(data);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleImagesUpdate = (updatedImages) => {
      if (updatedImages.length > 24) {
        const newImage = updatedImages[updatedImages.length - 1];
        setMosaicImage(images[0]);

        setTimeout(() => {
          setImages((prev) => [...prev.slice(1), newImage]);
          setMosaicImage(null);
        }, 3000);
      } else {
        setImages(updatedImages);
      }
    };

    socket.on("images_updated", handleImagesUpdate);

    return () => {
      socket.off("images_updated", handleImagesUpdate);
    };
  }, [socket, images]);

  return (
    <div
      className="bg-black w-full overflow-hidden relative"
      style={{ width: "5376px", height: "128px", display: "flex", gap: "0px" }}
    >
      {images.map((image, index) => (
        <div
          key={`${index}-${Date.now()}`}
          className="transition-all duration-500 ease-in-out"
          style={{ width: "224px", height: "128px", flexShrink: 0 }}
        >
          <img
            src={image}
            alt={`Display ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ width: "224px", height: "128px" }}
            onError={(e) => {
              console.error("Error loading image at index:", index);
              e.currentTarget.src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
            }}
          />
        </div>
      ))}

      {mosaicImage && (
        <MosaicTransition image={mosaicImage} onComplete={() => {}} />
      )}
    </div>
  );
};
