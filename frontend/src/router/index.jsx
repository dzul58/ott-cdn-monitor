import { createBrowserRouter } from "react-router-dom";
import Parent from "../pages/Parent";
import DetailChannel from "../pages/DetailChannel";
import Home from "../pages/Home";

// Komponen Error Boundary
function ErrorPage() {
  return (
    <div className="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Parent />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/detail/:id",
        element: <DetailChannel />,
      },
    ],
  },
]);

export default router;
