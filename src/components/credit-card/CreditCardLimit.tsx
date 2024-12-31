import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CreditCardLimitProps {
  onLimitUpdated: () => void;
}

export const CreditCardLimit = ({ onLimitUpdated }: CreditCardLimitProps) => {
  const [limit, setLimit] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLimit();
  }, []);

  const fetchLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_card_limits')
        .select('card_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setLimit(data?.card_limit?.toString() || '');
    } catch (error) {
      console.error('Erro ao buscar limite:', error);
      if (error.code !== 'PGRST116') {
        toast({
          title: "Erro",
          description: "Não foi possível buscar o limite",
          variant: "destructive",
        });
      }
    }
  };

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

      const { error } = await supabase
        .from('credit_card_limits')
        .upsert({
          user_id: user.id,
          card_limit: Number(limit)
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Limite do cartão atualizado com sucesso",
      });

      setIsEditing(false);
      onLimitUpdated();
    } catch (error) {
      console.error('Erro ao salvar limite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o limite",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Limite do Cartão</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Digite o limite do cartão"
            />
            <div className="flex space-x-2">
              <form onSubmit={handleSubmit}>
                <Button type="submit">Salvar</Button>
              </form>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Limite: R$ {limit ? parseFloat(limit).toFixed(2) : "0,00"}
            </p>
            <Button onClick={() => setIsEditing(true)}>
              {limit ? "Editar Limite" : "Definir Limite"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
