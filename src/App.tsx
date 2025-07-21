
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider"; // Corrected path
import { Toaster } from "@/components/ui/toaster";
import { NotFound } from "./pages/NotFound";
import { Index } from "./pages/Index";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
