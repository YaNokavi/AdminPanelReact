import { NavLink } from "react-router-dom";

export default function Header() {
  const getNavLinkClass = ({ isActive }) =>
    isActive
      ? "text-primary transition"
      : "text-text-muted hover:text-text-main transition";

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
      </div>
    </header>
  );
}
