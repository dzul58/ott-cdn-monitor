import { createBrowserRouter } from "react-router-dom";
import Parent from "../pages/Parent";
import Home from "../pages/Home";
import DetailChannel from "../pages/DetailChannel";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Parent />,
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
