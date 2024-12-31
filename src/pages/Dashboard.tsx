import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [expenseValue, setExpenseValue] = useState("");
  const [incomeValue, setIncomeValue] = useState("");
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
      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('month', selectedMonth.substring(0, 10));

      if (expensesError) throw expensesError;
      setExpenses(expensesData);
      setTotalExpenses(expensesData.reduce((acc, curr) => acc + Number(curr.value), 0));

      // Buscar receitas
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('month', selectedMonth.substring(0, 10));

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

  const handleAddExpense = async () => {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            description,
            value: Number(expenseValue),
            month: selectedMonth,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Despesa adicionada com sucesso",
      });

      setDescription("");
      setExpenseValue("");
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa",
        variant: "destructive",
      });
    }
  };

  const handleAddIncome = async () => {
    try {
      const { error } = await supabase
        .from('income')
        .insert([
          {
            value: Number(incomeValue),
            month: selectedMonth,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Receita adicionada com sucesso",
      });

      setIncomeValue("");
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar receita:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a receita",
        variant: "destructive",
      });
    }
  };

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const pieChartData = expenses.map((expense, index) => ({
    name: expense.description,
    value: Number(expense.value),
    color: COLORS[index % COLORS.length]
  }));

  const barChartData = [
    {
      name: 'Balanço',
      Receitas: totalIncome,
      Despesas: totalExpenses
    }
  ];

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

          {/* Adicionar Despesa */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Adicionar Despesa</h2>
            <div className="space-y-4">
              <Input
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Valor"
                value={expenseValue}
                onChange={(e) => setExpenseValue(e.target.value)}
              />
              <Button onClick={handleAddExpense} className="w-full">
                Adicionar Despesa
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Despesas do Mês</h3>
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span>{expense.description}</span>
                    <span>R$ {Number(expense.value).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Adicionar Receita */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Adicionar Receita</h2>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Valor"
                value={incomeValue}
                onChange={(e) => setIncomeValue(e.target.value)}
              />
              <Button onClick={handleAddIncome} className="w-full">
                Adicionar Receita
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Total de Receitas</h3>
              <div className="p-2 bg-gray-50 rounded">
                <span>R$ {totalIncome.toFixed(2)}</span>
              </div>
            </div>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Balanço Mensal</h3>
                <BarChart width={400} height={300} data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#3B82F6" />
                  <Bar dataKey="Despesas" fill="#EF4444" />
                </BarChart>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">Distribuição de Despesas</h3>
                <PieChart width={400} height={300}>
                  <Pie
                    data={pieChartData}
                    cx={200}
                    cy={150}
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;