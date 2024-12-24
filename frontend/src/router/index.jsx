import { createBrowserRouter} from 'react-router-dom';
import Parent from "../pages/Parent";
import Home from "../pages/home";

const router = createBrowserRouter([
    {
      element: <Parent />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/hmpdetails/:id",
          element: <DetailHomepass />,
        },

      ],
    },
  ]);
  
  export default router;