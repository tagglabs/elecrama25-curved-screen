import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { motion } from "framer-motion";

const GRID_SIZE = 8; // Configurable grid size for mosaic effect

export const DisplayView = () => {
  const [images, setImages] = useState([]);
  const [transitioningIndex, setTransitioningIndex] = useState(null);
  const [removedTiles, setRemovedTiles] = useState([]);
  const [incomingImage, setIncomingImage] = useState(null);
  const socket = useSocket();
  const backendUrl = import.meta.env.VITE_URL;

  useEffect(() => {
    const fetchImages = async () => {
      try {
        console.log("Fetching stored images");
        const response = await fetch(`${backendUrl}api/images`);
        if (!response.ok) throw new Error("Failed to fetch images");
        const data = await response.json();
        console.log("Loaded stored images:", data.length);

        const randomizedImages = data.sort(() => Math.random() - 0.5);
        setImages(randomizedImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [backendUrl]);

  useEffect(() => {
    if (!socket) {
      console.log("No socket connection available");
      return;
    }

    console.log("Setting up socket listeners in DisplayView");

    const handleImagesUpdate = (newImage) => {
      console.log("Received new image:");

      if (images.length < 16) {
        // For less than 16 images, simply append with fade-in
        setImages((currentImages) => [...currentImages, newImage]);
      } else {
        // For 16 or more images, use mosaic animation
        if (transitioningIndex !== null) {
          console.log("Animation already in progress, adding to queue");
          setTimeout(() => handleImagesUpdate(newImage), 1000);
          return;
        }

        const randomIndex = Math.floor(Math.random() * images.length);
        setTransitioningIndex(randomIndex);
        setIncomingImage(newImage);

        let tileIndices = Array.from(
          { length: GRID_SIZE * GRID_SIZE },
          (_, i) => i,
        );
        tileIndices = tileIndices.sort(() => Math.random() - 0.5);
        setRemovedTiles([]);

        tileIndices.forEach((tile, index) => {
          setTimeout(() => {
            setRemovedTiles((prev) => [...prev, tile]);
          }, index * 20);
        });

        setTimeout(() => {
          setImages((currentImages) => {
            const updatedImages = [...currentImages];
            updatedImages[randomIndex] = newImage;
            return updatedImages;
          });
          setTransitioningIndex(null);
          setRemovedTiles([]);
          setIncomingImage(null);
        }, tileIndices.length * 20 + 500);
      }
    };

    socket.on("new_image", handleImagesUpdate);

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("new_image", handleImagesUpdate);
    };
  }, [socket, images.length, transitioningIndex]);

  return (
    <div
      className="bg-black w-full overflow-hidden"
      style={{ width: "1920px", height: "1080px", display: "flex", gap: "0px" }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="relative"
          style={{ width: "120px", height: "128px", flexShrink: 0 }}
        >
          {transitioningIndex === index && incomingImage && (
            <React.Fragment key={`transition-${index}`}>
              {/* New Image Positioned Behind */}
              <img
                src={incomingImage}
                alt="Incoming"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: "120px", height: "128px" }}
                onError={(e) => {
                  console.error("Error loading incoming image");
                  e.target.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                }}
              />

              {/* Old Image Cut Into Tiles */}
              <div className="absolute inset-0 w-full h-full grid grid-cols-8 grid-rows-8">
                {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => {
                  const row = Math.floor(i / GRID_SIZE);
                  const col = i % GRID_SIZE;
                  return (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        top: `${(row * 100) / GRID_SIZE}%`,
                        left: `${(col * 100) / GRID_SIZE}%`,
                        backgroundImage: removedTiles.includes(i)
                          ? "none"
                          : `url(${images[index]})`,
                        backgroundSize: "120px 128px",
                        backgroundPosition: `-${(col * 224) / GRID_SIZE}px -${
                          (row * 128) / GRID_SIZE
                        }px`,
                      }}
                      animate={
                        removedTiles.includes(i)
                          ? { opacity: 0 }
                          : { opacity: 1 }
                      }
                      transition={{ duration: 0.4 }}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          )}
          <motion.img
            src={image}
            alt={`Display ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ width: "120px", height: "128px" }}
            initial={images.length < 16 ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              console.error("Error loading image at index:", index);
              e.target.src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
            }}
          />
        </div>
      ))}
    </div>
  );
};
