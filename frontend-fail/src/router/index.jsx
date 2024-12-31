import { createBrowserRouter} from 'react-router-dom';
import Parent from "../pages/Parent";
import DetailChannel from '../pages/DetailChannel';
import Home from '../pages/home';

const router = createBrowserRouter([
    {
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