import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.tsx";
import BuildsPage from "./pages/BuildsPage.tsx";
import ChaptersPage from "./pages/ChaptersPage.tsx";
import EarlyGearPage, { EarlyGearShieldsRedirect } from "./pages/EarlyGearPage.tsx";
import EarlyLayout from "./pages/EarlyLayout.tsx";
import EndgameLayout from "./pages/EndgameLayout.tsx";
import HomePage from "./pages/HomePage.tsx";
import TabletsPage from "./pages/TabletsPage.tsx";
import VendorPage from "./pages/VendorPage.tsx";
import WaystonesPage from "./pages/WaystonesPage.tsx";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="campaign" element={<Navigate to="/early" replace />} />
          <Route path="early" element={<EarlyLayout />}>
            <Route index element={<Navigate to="chapters" replace />} />
            <Route path="chapters" element={<ChaptersPage />} />
            <Route path="vendor" element={<VendorPage />} />
            <Route path="builds" element={<BuildsPage />} />
            <Route path="gear" element={<EarlyGearPage />} />
            <Route path="shields" element={<EarlyGearShieldsRedirect />} />
          </Route>
          <Route path="endgame" element={<EndgameLayout />}>
            <Route index element={<Navigate to="waystones" replace />} />
            <Route path="waystones" element={<WaystonesPage />} />
            <Route path="tablets" element={<TabletsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
