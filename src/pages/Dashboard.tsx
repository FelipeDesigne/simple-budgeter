import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { IncomeForm } from "@/components/income/IncomeForm";
import { FinancialCharts } from "@/components/summary/FinancialCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletCards, Receipt, CreditCard, Wallet } from "lucide-react";
import { CreditCardLimit } from "@/components/credit-card/CreditCardLimit";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [months, setMonths] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [creditCardLimit, setCreditCardLimit] = useState(0);
  const [creditCardExpenses, setCreditCardExpenses] = useState(0);
  const [futureInstallments, setFutureInstallments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const fetchExpenses = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      console.log('Buscando despesas...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado ao buscar despesas');
        return;
      }

      if (!selectedMonth) {
        console.error('Mês não selecionado ao buscar despesas');
        return;
      }

      console.log('Mês selecionado:', selectedMonth);

      // Formatar a data para o primeiro dia do mês
      const [year, month] = selectedMonth.split('-');
      const formattedMonth = `${year}-${month}-01`;
      console.log('Mês formatado:', formattedMonth);

      // Buscar todas as despesas do mês selecionado
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('month', formattedMonth)
        .eq('user_id', user.id);

      if (expensesError) {
        console.error('Erro ao buscar despesas:', expensesError);
        throw expensesError;
      }

      console.log('Despesas encontradas:', expensesData);

      // Calcular total de despesas
      const total = expensesData?.reduce((acc, expense) => acc + expense.value, 0) || 0;
      console.log('Total de despesas:', total);
      setTotalExpenses(total);

      // Calcular total de despesas no cartão de crédito
      const creditCardTotal = expensesData?.reduce((acc, expense) => 
        expense.payment_method === 'credit_card' ? acc + expense.value : acc, 0) || 0;
      console.log('Total de despesas no cartão:', creditCardTotal);
      setCreditCardExpenses(creditCardTotal);

      setExpenses(expensesData || []);

      // Buscar limite do cartão (agora é global)
      const { data: limitData, error: limitError } = await supabase
        .from('credit_card_limits')
        .select('card_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!limitError && limitData?.card_limit) {
        console.log('Limite do cartão:', limitData.card_limit);
        setCreditCardLimit(limitData.card_limit);
      }

      // Buscar parcelas futuras do cartão de crédito
      const [nextYear, nextMonth] = format(addMonths(new Date(formattedMonth), 1), 'yyyy-MM').split('-');
      const futureStartDate = `${nextYear}-${nextMonth}-01`;
      const [endYear, endMonth] = format(addMonths(new Date(formattedMonth), 12), 'yyyy-MM').split('-');
      const futureEndDate = `${endYear}-${endMonth}-01`;

      console.log('Buscando parcelas futuras de', futureStartDate, 'até', futureEndDate);

      const { data: futureInstallmentsData, error: futureError } = await supabase
        .from('expenses')
        .select('value')
        .eq('user_id', user.id)
        .eq('payment_method', 'credit_card')
        .gte('month', futureStartDate)
        .lt('month', futureEndDate);

      if (!futureError && futureInstallmentsData) {
        const futureTotal = futureInstallmentsData.reduce((acc, expense) => acc + expense.value, 0);
        console.log('Total de parcelas futuras:', futureTotal);
        setFutureInstallments(futureTotal);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as despesas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !selectedMonth) return;

      const monthDate = new Date(selectedMonth);
      const formattedMonth = format(monthDate, 'yyyy-MM-dd');

      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('month', formattedMonth)
        .eq('user_id', user.id);

      if (incomeError) throw incomeError;

      const total = incomeData?.reduce((acc, income) => acc + Number(income.value), 0) || 0;
      setTotalIncome(total);
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as receitas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const currentDate = new Date();
    const monthOptions = [];
    
    // Gerar opções para os próximos 12 meses a partir do mês atual
    for (let i = 0; i < 12; i++) {
      const date = addMonths(currentDate, i);
      const monthStr = format(date, 'yyyy-MM-dd');
      const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
      
      monthOptions.push({
        value: monthStr,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      });
    }

    setMonths(monthOptions);
    // Definir o mês atual como selecionado
    setSelectedMonth(format(currentDate, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchExpenses();
      fetchIncome();
    }
  }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-foreground">
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
              <WalletCards className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {totalExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {(totalIncome - totalExpenses).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cartão</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Limite: R$ {creditCardLimit.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Gasto no Mês: R$ {creditCardExpenses.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Parcelas Futuras: R$ {futureInstallments.toFixed(2)}
                </div>
                <div className={`text-2xl font-bold ${(creditCardLimit - creditCardExpenses) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  Disponível: R$ {(creditCardLimit - creditCardExpenses).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Month Selector */}
        <Card className="mb-8 bg-card">
          <CardHeader>
            <CardTitle>Selecionar Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Forms */}
          <ExpenseForm selectedMonth={selectedMonth} onExpenseAdded={fetchExpenses} />
          <IncomeForm selectedMonth={selectedMonth} onIncomeAdded={fetchIncome} />
        </div>

        {/* Credit Card Limit */}
        <div className="mt-8">
          <CreditCardLimit onLimitUpdated={fetchExpenses} />
        </div>

        {/* Charts */}
        <Card className="mt-8 bg-card">
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialCharts 
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              expenses={expenses}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;