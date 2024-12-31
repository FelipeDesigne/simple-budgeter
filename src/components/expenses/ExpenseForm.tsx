import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseFormProps {
  selectedMonth: string;
  onExpenseAdded: () => void;
}

export const ExpenseForm = ({ selectedMonth, onExpenseAdded }: ExpenseFormProps) => {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [expenseValue, setExpenseValue] = useState("");

  const handleAddExpense = async () => {
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

      const { error } = await supabase
        .from('expenses')
        .insert({
          description,
          value: Number(expenseValue),
          month: selectedMonth,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Despesa adicionada com sucesso",
      });

      setDescription("");
      setExpenseValue("");
      onExpenseAdded();
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Adicionar Despesa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary"
          />
          <Input
            type="number"
            placeholder="Valor"
            value={expenseValue}
            onChange={(e) => setExpenseValue(e.target.value)}
            className="bg-secondary"
          />
          <Button onClick={handleAddExpense} className="w-full">
            Adicionar Despesa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};