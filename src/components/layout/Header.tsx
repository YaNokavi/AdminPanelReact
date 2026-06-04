import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? "text-primary transition"
      : "text-text-muted hover:text-text-main transition";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-8">
        <span className="text-xl font-bold text-text-heading">CunaEdu</span>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/" className={getNavLinkClass}>
            Главная
          </NavLink>
          <NavLink to="/faq" className={getNavLinkClass}>
            FAQ
          </NavLink>
          <NavLink to="/contacts" className={getNavLinkClass}>
            Контакты
          </NavLink>
        </nav>
        <button
          onClick={handleLogout}
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-red-500 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Выйти
        </button>
      </div>
    </header>
  );
}
