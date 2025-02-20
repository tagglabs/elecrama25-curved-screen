import { useState } from "react";
import { useSocket } from "../context/SocketContext";

export const TabletView = () => {
  const [step, setStep] = useState("register");
  const [name, setName] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name.trim() || !socket) return;

    setLoading(true);
    console.log("Registering user:", name);
    socket.emit("register_user", { name });

    socket.once("user_registered", (user) => {
      console.log("User registered:", user);
      setUserId(user._id);
      setStep("camera");
      setLoading(false);
    });

    socket.once("registration_error", (error) => {
      console.error("Registration error:", error);
      alert("Registration failed: " + error);
    });
  };

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Image captured:", file.name, "Size:", file.size);

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result;
        console.log("Image converted to base64, length:", imageData?.length);
        setCapturedImage(imageData);
        setStep("preview");
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("Error reading image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitImage = () => {
    if (!socket || !capturedImage || !userId) {
      console.error("Missing required data:", {
        socketConnected: !!socket,
        hasImage: !!capturedImage,
        userId,
      });
      return;
    }

    setLoading(true);

    console.log("Submitting image for user:", userId);
    console.log("Image data length:", capturedImage.length);

    socket.emit("submit_image", {
      userId,
      imageData: capturedImage,
    });

    // Listen for success/error responses
    socket.on("reset_current_tablet", () => {
      console.log("Image submitted successfully:");
      // Reset for next user
      setLoading(false);
      setName("");
      setCapturedImage(null);
      setUserId(null);
      setStep("register");
    });

    socket.once("image_error", (error) => {
      console.error("Image submission error:", error);
      alert("Failed to submit image: " + error);
    });
  };

  if (step === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <form
          onSubmit={handleRegister}
          className="bg-white rounded-lg shadow-md w-96 py-16 px-16 text-center"
        >
          <h1 className="text-4xl font-black mb-6 text-center">Welcome!</h1>
          <h2 className="text-xl font-semibold mb-8">
            Let&apos;s get started with your name
          </h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-2 border rounded mb-8"
            required
          />
          <button
            type="submit"
            className="w-full border-2 font-semibold border-blue-500 text-blue-500 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
          >
            {loading ? <Loader /> : "Register"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "camera") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-black mb-4 text-center">Take a Photo</h2>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="cameraInput"
                className="hidden"
                onChange={handleImageCapture}
              />
              <label
                htmlFor="cameraInput"
                className="w-full bg-blue-500 text-white font-semibold p-3 rounded-lg text-center cursor-pointer hover:bg-blue-600"
              >
                Tap to Open Camera
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Preview Photo
        </h2>
        <div className="space-y-4">
          <img
            src={capturedImage}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setStep("camera")}
              className="bg-gray-500 text-white w-36 rounded-full px-6 py-2  hover:bg-gray-600"
            >
              Retake
            </button>
            <button
              onClick={handleSubmitImage}
              className={`bg-green-500 text-white w-36 rounded-full px-6 py-2 hover:bg-green-600 ${
                loading && "opacity-50 cursor-not-allowed"
              }`}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Make a Loader component

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
};
