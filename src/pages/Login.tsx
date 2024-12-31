import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Controle Financeiro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login para gerenciar suas finanças
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  inputText: '#ffffff',
                  inputBackground: '#1f2937',
                }
              }
            },
            style: {
              input: {
                paddingRight: '2.5rem',
              },
              button: {
                backgroundColor: '#2563eb',
                color: '#ffffff',
              }
            },
            className: {
              container: 'space-y-4',
              label: 'text-foreground',
              button: 'bg-primary text-primary-foreground hover:bg-primary/90',
              input: 'bg-background text-foreground'
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                link_text: 'Já tem uma conta? Entre aqui'
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Senha',
                button_label: 'Cadastrar',
                loading_button_label: 'Cadastrando...',
                link_text: 'Não tem uma conta? Cadastre-se'
              }
            }
          }}
          theme="dark"
          providers={[]}
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  );
};

export default Login;