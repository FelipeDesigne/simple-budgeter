import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Controle Financeiro
            </h1>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="text-sm"
            >
              Sair
            </Button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Bem-vindo ao seu Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Aqui você poderá gerenciar suas receitas e despesas.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;