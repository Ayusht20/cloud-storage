import {
  Files,
  Search,
  Trash2,
  Share2,
  Settings,
  Cloud,
  ChevronRight,
  User,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const Layout = ({
  children,
  search,
  setSearch,
}) => {

  const { user } = useAuth();


  // ==========================================================
  // NAVIGATION
  // ==========================================================

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


  // ==========================================================
  // USER INITIAL
  // ==========================================================

  const userInitial =
    user?.full_name
      ?.charAt(0)
      ?.toUpperCase() ||
    user?.email
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">


      {/* ======================================================
          APPLICATION SHELL
      ====================================================== */}

      <div className="flex min-h-screen">


        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className="
            hidden
            w-[260px]
            shrink-0
            border-r
            border-slate-200/80
            bg-white
            md:flex
            md:flex-col
          "
        >


          {/* --------------------------------------------------
              BRAND
          -------------------------------------------------- */}

          <div className="flex h-[76px] items-center border-b border-slate-100 px-6">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                  text-white
                  shadow-sm
                "
              >
                <Cloud size={21} strokeWidth={2.2} />
              </div>


              <div className="min-w-0">

                <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
                  Cloud Storage
                </h1>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your files, anywhere
                </p>

              </div>

            </div>

          </div>


          {/* --------------------------------------------------
              NAVIGATION
          -------------------------------------------------- */}

          <div className="flex-1 px-4 py-6">

            <p
              className="
                mb-3
                px-3
                text-[10px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-slate-400
              "
            >
              Workspace
            </p>


            <nav className="space-y-1.5">

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
                      `
                        group
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-sm
                        font-medium
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `
                    }
                  >

                    {({ isActive }) => (

                      <>

                        <div
                          className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            transition
                            ${
                              isActive
                                ? "bg-white/10"
                                : "bg-slate-100 group-hover:bg-white"
                            }
                          `}
                        >

                          <Icon
                            size={18}
                            strokeWidth={2}
                          />

                        </div>


                        <span className="flex-1">
                          {name}
                        </span>


                        <ChevronRight
                          size={15}
                          className={`
                            transition-all
                            ${
                              isActive
                                ? "translate-x-0 opacity-70"
                                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-40"
                            }
                          `}
                        />

                      </>

                    )}

                  </NavLink>

                )
              )}

            </nav>

          </div>


          {/* --------------------------------------------------
              USER PROFILE
          -------------------------------------------------- */}

          <div className="border-t border-slate-100 p-4">

            <div
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-slate-100
                bg-slate-50
                p-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-900
                  text-sm
                  font-bold
                  text-white
                "
              >
                {userInitial}
              </div>


              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.full_name || "User"}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {user?.email || "Account"}
                </p>

              </div>


              <User
                size={16}
                className="shrink-0 text-slate-300"
              />

            </div>

          </div>

        </aside>


        {/* ====================================================
            MAIN APPLICATION AREA
        ==================================================== */}

        <div className="flex min-w-0 flex-1 flex-col">


          {/* ==================================================
              TOP HEADER
          ================================================== */}

          <header
            className="
              sticky
              top-0
              z-40
              flex
              min-h-[76px]
              items-center
              gap-4
              border-b
              border-slate-200/80
              bg-white/95
              px-4
              backdrop-blur
              sm:px-6
              md:px-8
            "
          >


            {/* ------------------------------------------------
                MOBILE BRAND
            ------------------------------------------------ */}

            <div className="flex items-center gap-2 md:hidden">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-900
                  text-white
                "
              >
                <Cloud size={19} />
              </div>

            </div>


            {/* ------------------------------------------------
                SEARCH
            ------------------------------------------------ */}

            <div className="relative w-full max-w-2xl">

              <Search
                size={18}
                strokeWidth={2}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
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
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-transparent
                  bg-slate-100
                  pl-11
                  pr-4
                  text-sm
                  text-slate-800
                  outline-none
                  placeholder:text-slate-400
                  transition-all
                  duration-200
                  focus:border-slate-200
                  focus:bg-white
                  focus:ring-4
                  focus:ring-slate-100
                "
              />

            </div>


            {/* ------------------------------------------------
                HEADER ACTIONS
            ------------------------------------------------ */}

            <div className="ml-auto flex items-center gap-2">

              <button
                type="button"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  hover:text-slate-800
                "
                title="Settings"
              >

                <Settings size={19} />

              </button>


              {/* Mobile user avatar */}

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-900
                  text-xs
                  font-bold
                  text-white
                  md:hidden
                "
              >
                {userInitial}
              </div>

            </div>

          </header>


          {/* ==================================================
              PAGE CONTENT
          ================================================== */}

          <main
            className="
              flex-1
              px-4
              py-5
              sm:px-6
              sm:py-6
              md:px-8
              md:py-8
              lg:px-10
            "
          >

            <div className="mx-auto w-full max-w-[1500px]">

              {children}

            </div>

          </main>


        </div>

      </div>

    </div>
  );
};


export default Layout;