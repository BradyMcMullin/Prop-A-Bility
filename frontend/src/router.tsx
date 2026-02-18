import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import NotFound from "./components/NotFound"; // Import the new file
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },

  // Protected Routes
  {
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/upload", element: <Upload /> },
    ]
  },
  //404 not found catch all
  {
    path: "*", element: <NotFound />
  }
]);

