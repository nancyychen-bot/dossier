import { DossierApp } from "@/components/DossierApp";
import { DossierProvider } from "@/lib/store";

export default function Home() {
  return (
    <DossierProvider>
      <DossierApp />
    </DossierProvider>
  );
}
