import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PublicFile from "./pages/PublicFile";

import ProtectedRoute from "./components/ProtectedRoute";
import Shared from "./pages/Shared";
import Trash from "./pages/Trash";
const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
<Route
  path="/trash"
  element={
    <ProtectedRoute>
      <Trash />
    </ProtectedRoute>
  }
/>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
  path="/shared"
  element={
    <ProtectedRoute>
      <Shared />
    </ProtectedRoute>
  }
/>

        <Route
          path="/register"
          element={<Register />}
        />

        {/* PRIVATE */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
          
        />

        {/* PUBLIC — NO ProtectedRoute */}
        <Route
          path="/public/:token"
          element={<PublicFile />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
};


export default App;