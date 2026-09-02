import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { LabShell } from "@/components/layout/LabShell";
import { LabProvider } from "@/state/LabContext";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { HomePage } from "@/pages/HomePage";
import { getExperiment } from "@/data/experiments";

function LabRoute() {
  return (
    <LabProvider>
      <LabShell />
    </LabProvider>
  );
}

function ExperimentGate() {
  const { id } = useParams();
  const exp = getExperiment(Number(id));
  if (!exp) return <Navigate to="/" replace />;
  if (!exp.implemented) return <ComingSoonPage />;
  return <LabRoute />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/lab/:id" element={<ExperimentGate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
