import Navbar from "@/components/Navbar";

// Every page inside the (app) folder gets the navbar and a centered container
export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </>
  );
}
