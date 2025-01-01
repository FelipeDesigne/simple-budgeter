import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMonths, format } from 'date-fns';

interface ExpenseFormProps {
  selectedMonth: string;
  onExpenseAdded: () => void;
}

export const ExpenseForm = ({ selectedMonth, onExpenseAdded }: ExpenseFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    category: '',
    payment_method: 'money',
    installments: '1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      const installmentGroup = crypto.randomUUID();
      const numberOfInstallments = parseInt(formData.installments);
      const installmentValue = Number(formData.value) / numberOfInstallments;

      // Criar array de promessas para todas as parcelas
      const baseDate = new Date(selectedMonth);
      const installmentPromises = Array.from({ length: numberOfInstallments }, (_, index) => {
        // Garantir que a data base esteja no primeiro dia do mês
        const installmentDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + index, 1);
        const monthFormatted = format(installmentDate, 'yyyy-MM-dd');
        
        const expenseData = {
          description: `${formData.description}${numberOfInstallments > 1 ? ` (${index + 1}/${numberOfInstallments})` : ''}`,
          value: installmentValue,
          category: formData.category,
          payment_method: formData.payment_method,
          month: monthFormatted,
          user_id: user.id,
          installments: numberOfInstallments,
          current_installment: index + 1,
          installment_group: installmentGroup
        };

        console.log('Inserindo parcela:', expenseData);
        
        return supabase
          .from('expenses')
          .insert(expenseData)
          .select();
      });

      // Executar todas as inserções
      const results = await Promise.all(installmentPromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('Erros ao inserir parcelas:', errors);
        throw errors[0].error;
      }

      // Limpar o formulário antes de chamar onExpenseAdded
      setFormData({
        description: '',
        value: '',
        category: '',
        payment_method: 'money',
        installments: '1'
      });

      // Aguardar um pequeno delay para garantir que os dados foram inseridos
      await new Promise(resolve => setTimeout(resolve, 500));

      // Chamar onExpenseAdded após o delay
      onExpenseAdded();

      toast({
        title: "Sucesso",
        description: numberOfInstallments > 1 
          ? `Despesa parcelada em ${numberOfInstallments}x adicionada com sucesso`
          : "Despesa adicionada com sucesso",
      });

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-secondary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              type="number"
              placeholder="Valor"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="bg-secondary"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alimentacao">Alimentação</SelectItem>
                <SelectItem value="transporte">Transporte</SelectItem>
                <SelectItem value="moradia">Moradia</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
                <SelectItem value="lazer">Lazer</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="money">Dinheiro</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.payment_method === 'credit_card' && (
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Select
                value={formData.installments}
                onValueChange={(value) => setFormData({ ...formData, installments: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x {formData.value && `(R$ ${(Number(formData.value) / num).toFixed(2)} por parcela)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full">
            Adicionar Despesa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};