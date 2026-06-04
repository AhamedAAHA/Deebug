import { formatCurrency } from '../../utils/formatters';

export default function BoqTable({ items }) {
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="boq-table-wrap glass-card">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Category</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate (LKR)</th>
              <th>Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td><span className="badge badge-info">{item.category}</span></td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>{formatCurrency(item.rate)}</td>
                <td className="amount-cell">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700 }}>Grand Total</td>
              <td className="amount-cell" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
