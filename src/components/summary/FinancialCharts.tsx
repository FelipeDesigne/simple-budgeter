import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface Expense {
  description: string;
  value: number;
}

interface FinancialChartsProps {
  totalIncome: number;
  totalExpenses: number;
  expenses: Expense[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const FinancialCharts = ({ totalIncome, totalExpenses, expenses }: FinancialChartsProps) => {
  const barChartData = [
    {
      name: 'Balanço',
      Receitas: totalIncome,
      Despesas: totalExpenses
    }
  ];

  const pieChartData = expenses.map((expense, index) => ({
    name: expense.description,
    value: Number(expense.value),
    color: COLORS[index % COLORS.length]
  }));

  return (
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
  );
};