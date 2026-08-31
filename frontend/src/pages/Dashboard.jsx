import { useAuth } from "../context/AuthContext";


const Dashboard = () => {
  const { user } =
    useAuth();


  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          Cloud Storage
        </h1>

        <p className="mt-2 text-slate-500">
          Welcome,{" "}
          {user?.full_name || user?.email}
        </p>
      </div>
    </main>
  );
};


export default Dashboard;