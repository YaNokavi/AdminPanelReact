import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-text-main">
      <Header />

      <main className="flex-grow flex flex-col items-center p-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
