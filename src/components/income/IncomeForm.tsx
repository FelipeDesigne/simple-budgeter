import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IncomeFormProps {
  selectedMonth: string;
  onIncomeAdded: () => void;
}

export const IncomeForm = ({ selectedMonth, onIncomeAdded }: IncomeFormProps) => {
  const { toast } = useToast();
  const [incomeValue, setIncomeValue] = useState("");

  const handleAddIncome = async () => {
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
        .from('income')
        .insert({
          value: Number(incomeValue),
          month: selectedMonth,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Receita adicionada com sucesso",
      });

      setIncomeValue("");
      onIncomeAdded();
    } catch (error) {
      console.error('Erro ao adicionar receita:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a receita",
        variant: "destructive",
      });
    }
  };

  return (
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
    </div>
  );
};