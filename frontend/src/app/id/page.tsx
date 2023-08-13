import { Spinner } from "../components/Spinner";

export default function Page() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2">
      <Spinner />
      <h1>Generating a unique ID for you...</h1>
    </main>
  );
}
