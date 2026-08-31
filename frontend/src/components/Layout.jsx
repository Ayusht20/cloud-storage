import {
  Files,
  Folder,
  Search,
  Trash2,
  Share2,
  Settings,
  Cloud,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Layout = ({
  children,
  search,
  setSearch,
}) => {
  const { user } = useAuth();


  const navigation = [
    {
      name: "My Files",
      path: "/dashboard",
      icon: Files,
    },
    {
      name: "Shared",
      path: "/shared",
      icon: Share2,
    },
    {
      name: "Trash",
      path: "/trash",
      icon: Trash2,
    },
  ];


  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">

        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Cloud size={22} />
          </div>

          <div>
            <h1 className="font-bold">
              Cloud Storage
            </h1>

            <p className="text-xs text-slate-400">
              Your files, anywhere
            </p>
          </div>
        </div>


        <nav className="flex-1 space-y-1 p-4">

          {navigation.map(
            ({
              name,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={19} />
                {name}
              </NavLink>
            )
          )}

        </nav>


        <div className="border-t border-slate-200 p-4">

          <div className="flex items-center gap-3 rounded-xl p-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold">
              {user?.full_name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.full_name ||
                  "User"}
              </p>

              <p className="truncate text-xs text-slate-400">
                {user?.email}
              </p>
            </div>

          </div>

        </div>

      </aside>


      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">

        <header className="flex h-20 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-8">

          <div className="relative max-w-xl flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search files and folders..."
              className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-200"
            />

          </div>


          <button
            className="hidden rounded-xl p-3 text-slate-500 hover:bg-slate-100 sm:block"
            title="Settings"
          >
            <Settings size={20} />
          </button>

        </header>


        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

      </div>

    </div>
  );
};


export default Layout;