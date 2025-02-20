import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { TabletView } from "./views/TabletView";
import { DisplayView } from "./views/DisplayView";
import { TestView } from "./views/TestView";

export default function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <h1 className="text-3xl font-bold mb-8">Choose View Mode</h1>
                <div className="space-y-4">
                  <Link
                    to="/tablet"
                    className="block w-64 text-center bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Tablet View
                  </Link>
                  <Link
                    to="/display"
                    className="block w-64 text-center bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Display View
                  </Link>
                </div>
              </div>
            }
          />
          <Route path="/tablet" element={<TabletView />} />
          <Route path="/display" element={<DisplayView />} />
          <Route path="/test" element={<TestView />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}
