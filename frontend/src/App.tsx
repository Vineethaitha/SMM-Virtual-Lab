import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { LabShell } from "@/components/layout/LabShell";
import { LabProvider } from "@/state/LabContext";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { HomePage } from "@/pages/HomePage";
import { Exp6Shell } from "@/pages/Exp6Shell";
import { Exp7Shell } from "@/pages/Exp7Shell";
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
  const numId = Number(id);
  const exp = getExperiment(numId);
  if (!exp) return <Navigate to="/" replace />;
  if (!exp.implemented) return <ComingSoonPage />;
  // Experiment-specific shells for 6 and 7
  if (numId === 6) return <Exp6Shell />;
  if (numId === 7) return <Exp7Shell />;
  // Experiment 1 (and any future experiments using the same shell)
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
