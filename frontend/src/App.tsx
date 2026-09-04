import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { LabShell } from "@/components/layout/LabShell";
import { LabProvider } from "@/state/LabContext";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { HomePage } from "@/pages/HomePage";
import { CustomerSatisfactionPage } from "@/pages/CustomerSatisfactionPage";
import { ObjectOrientedMetricsPage } from "@/pages/ObjectOrientedMetricsPage";
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
  const expId = Number(id);
  const exp = getExperiment(expId);
  if (!exp) return <Navigate to="/" replace />;
  if (!exp.implemented) return <ComingSoonPage />;
  // Experiment 4 has its own dedicated page
  if (expId === 4) return <CustomerSatisfactionPage />;
  // Experiment 5 has its own dedicated page
  if (expId === 5) return <ObjectOrientedMetricsPage />;
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
