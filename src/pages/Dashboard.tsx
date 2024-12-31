import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { IncomeForm } from "@/components/income/IncomeForm";
import { FinancialCharts } from "@/components/summary/FinancialCharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expenses, setExpenses] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('month', selectedMonth.substring(0, 10))
        .eq('user_id', user.id);

      if (expensesError) throw expensesError;
      setExpenses(expensesData);
      setTotalExpenses(expensesData.reduce((acc, curr) => acc + Number(curr.value), 0));

      // Buscar receitas
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('month', selectedMonth.substring(0, 10))
        .eq('user_id', user.id);

      if (incomeError) throw incomeError;
      setTotalIncome(incomeData.reduce((acc, curr) => acc + Number(curr.value), 0));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const getMonthOptions = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMMM yyyy', { locale: ptBR })
      });
    }
    return months;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seletor de Mês */}
          <div className="col-span-full bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Selecionar Mês</h2>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formulários */}
          <ExpenseForm selectedMonth={selectedMonth} onExpenseAdded={fetchData} />
          <IncomeForm selectedMonth={selectedMonth} onIncomeAdded={fetchData} />

          {/* Resumo */}
          <div className="col-span-full bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Resumo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Receitas</h3>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="text-sm font-medium text-red-800">Despesas</h3>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Saldo</h3>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Gráficos */}
            <FinancialCharts 
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              expenses={expenses}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;