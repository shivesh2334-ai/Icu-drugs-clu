import InfusionCalculator from "./InfusionCalculator.jsx";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <>
      <InfusionCalculator />
      <Analytics />
    </>
  );
}
