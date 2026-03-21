import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Layout from "../components/layout/Layout";
import NotFoundPage from "../pages/NotFoundPage";
import ContactsPage from "../pages/ContactsPage";
import FAQPage from "../pages/FAQPage";
import HomePage from "../pages/HomePage";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="faq" element={<FAQPage />} />
      <Route path="contacts" element={<ContactsPage />} />
      {/* Маршрут для обработки несуществующих страниц (404) */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);
