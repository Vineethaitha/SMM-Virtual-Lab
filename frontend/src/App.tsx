import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { LabShell } from "@/components/layout/LabShell";
import { LabProvider } from "@/state/LabContext";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { HomePage } from "@/pages/HomePage";
import { Exp6Shell } from "@/pages/Exp6Shell";
import { Exp7Shell } from "@/pages/Exp7Shell";
import { CustomerSatisfactionPage } from "@/pages/CustomerSatisfactionPage";
import { ObjectOrientedMetricsPage } from "@/pages/ObjectOrientedMetricsPage";
import { TestCaseManagementPage } from "@/pages/TestCaseManagementPage";
import { SoftwareSizeEstimationPage } from "@/pages/SoftwareSizeEstimationPage";
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
  if (expId === 2) return <TestCaseManagementPage />;
  if (expId === 3) return <SoftwareSizeEstimationPage />;
  if (expId === 4) return <CustomerSatisfactionPage />;
  if (expId === 5) return <ObjectOrientedMetricsPage />;
  if (expId === 6) return <Exp6Shell />;
  if (expId === 7) return <Exp7Shell />;
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
