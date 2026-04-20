import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ExpenseCategory =
  | 'Groceries'
  | 'Utilities'
  | 'Transportation'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Housing'
  | 'Other'

type CategorySummaryRow = {
  category: ExpenseCategory
  amount: number
  share: number
}

type CashFlowChartRow = {
  name: string
  amount: number
  color: string
}

type MemberTotalRow = {
  member: string
  income: number
  spent: number
  net: number
}

type InsightsSectionProps = {
  categorySummaryRows: CategorySummaryRow[]
  cashFlowChartData: CashFlowChartRow[]
  memberTotals: MemberTotalRow[]
  formatCurrencyValue: (value: number) => string
  formatTooltipValue: (value: string | number | readonly (string | number)[] | undefined) => string
  getCategoryColor: (category: ExpenseCategory) => string
}

function InsightsSection({
  categorySummaryRows,
  cashFlowChartData,
  memberTotals,
  formatCurrencyValue,
  formatTooltipValue,
  getCategoryColor,
}: InsightsSectionProps) {
  return (
    <section className="insights-grid" aria-label="Charts and summaries">
      <article className="insight-card">
        <div className="panel-header compact">
          <h2>Category Summary</h2>
          <span>expense mix</span>
        </div>
        {categorySummaryRows.length === 0 ? (
          <p className="empty-state">No spending for the selected filters.</p>
        ) : (
          <div className="summary-list">
            {categorySummaryRows.map((row) => (
              <div key={row.category} className="summary-row">
                <div className="summary-row-header">
                  <span>{row.category}</span>
                  <strong>{formatCurrencyValue(row.amount)}</strong>
                </div>
                <div className="summary-bar">
                  <div
                    className="summary-fill"
                    style={{ width: `${row.share}%`, backgroundColor: getCategoryColor(row.category) }}
                  />
                </div>
                <small>{row.share}% of monthly spending</small>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="insight-card">
        <div className="panel-header compact">
          <h2>Cash Flow Chart</h2>
          <span>income vs spend</span>
        </div>
        <div className="chart-frame" role="img" aria-label="Cash flow bar chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashFlowChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe3ee" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyValue(value)} />
              <Tooltip formatter={(value) => formatTooltipValue(value)} />
              <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="insight-card">
        <div className="panel-header compact">
          <h2>Household Member Totals</h2>
          <span>per member</span>
        </div>
        {memberTotals.length === 0 ? (
          <p className="empty-state">No member totals available for this month.</p>
        ) : (
          <div className="member-summary-list">
            {memberTotals.map((row) => (
              <article key={row.member} className="member-card">
                <div>
                  <p className="member-name">{row.member}</p>
                  <p className="member-meta">
                    Income {formatCurrencyValue(row.income)} • Spent {formatCurrencyValue(row.spent)}
                  </p>
                </div>
                <strong className={row.net >= 0 ? 'net-positive' : 'net-negative'}>
                  {formatCurrencyValue(row.net)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

export default InsightsSection