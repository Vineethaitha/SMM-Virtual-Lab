import { LabShell } from "@/components/layout/LabShell";
import { LabProvider } from "@/state/LabContext";

export default function App() {
  return (
    <LabProvider>
      <LabShell />
    </LabProvider>
  );
}
