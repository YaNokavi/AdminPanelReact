import {
  createHashRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Layout from "../components/layout/Layout";
import NotFoundPage from "../pages/NotFoundPage";
import ContactsPage from "../pages/ContactsPage";
import FAQPage from "../pages/FAQPage";
import HomePage from "../pages/HomePage";

export const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="faq" element={<FAQPage />} />
      <Route path="contacts" element={<ContactsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
  // {
  //   basename: "/AdminPanelReact",
  // },
);
