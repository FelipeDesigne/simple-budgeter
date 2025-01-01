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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      if (!selectedMonth) return;

      // Formatar a data para o primeiro dia do mês
      const monthDate = new Date(selectedMonth);
      const formattedMonth = format(monthDate, 'yyyy-MM-dd');

      // Buscar todas as despesas do mês selecionado
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('month', formattedMonth)
        .eq('user_id', user.id);

      if (expensesError) throw expensesError;

      // Calcular total de despesas
      const total = expensesData?.reduce((acc, expense) => acc + expense.value, 0) || 0;
      setTotalExpenses(total);

      // Calcular total de despesas no cartão de crédito
      const creditCardTotal = expensesData?.reduce((acc, expense) => 
        expense.payment_method === 'credit_card' ? acc + expense.value : acc, 0) || 0;
      setCreditCardExpenses(creditCardTotal);

      setExpenses(expensesData || []);

      // Buscar limite do cartão (agora é global)
      const { data: limitData, error: limitError } = await supabase
        .from('credit_card_limits')
        .select('card_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!limitError && limitData?.card_limit) {
        setCreditCardLimit(limitData.card_limit);
      }

      // Buscar parcelas futuras do cartão de crédito
      const nextMonth = addMonths(monthDate, 1);
      const futureStartDate = format(nextMonth, 'yyyy-MM-dd');
      const futureEndDate = format(addMonths(monthDate, 12), 'yyyy-MM-dd');

      const { data: futureInstallmentsData, error: futureError } = await supabase
        .from('expenses')
        .select('value')
        .eq('user_id', user.id)
        .eq('payment_method', 'credit_card')
        .gte('month', futureStartDate)
        .lt('month', futureEndDate);

      if (!futureError && futureInstallmentsData) {
        const futureTotal = futureInstallmentsData.reduce((acc, expense) => acc + expense.value, 0);
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
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month: any) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleSignOut}>Sair</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cartão de Crédito</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {creditCardExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Limite: R$ {creditCardLimit.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parcelas Futuras</CardTitle>
              <WalletCards className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {futureInstallments.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FinancialCharts
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            expenses={expenses}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExpenseForm selectedMonth={selectedMonth} onExpenseAdded={fetchExpenses} />
          <div className="space-y-6">
            <IncomeForm selectedMonth={selectedMonth} onIncomeAdded={fetchIncome} />
            <CreditCardLimit onLimitUpdated={fetchExpenses} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;