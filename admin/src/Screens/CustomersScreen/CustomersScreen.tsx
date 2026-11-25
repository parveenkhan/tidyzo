import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { loadCustomers } from '../../Redux/Actions/Workspace.Action';

export default function CustomersScreen() {
  const dispatch = useAppDispatch();
  const { customers, error } = useAppSelector((state) => state.workspace);
  useEffect(() => { dispatch(loadCustomers()); }, [dispatch]);

  return (
    <>
      <h2>Customers</h2>
      {error ? <p className="error">{error}</p> : null}
      <section className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Mobile</th><th>Address</th><th>Bookings</th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>+91 {customer.mobile}</td>
                <td>{[customer.addressLine, customer.city].filter(Boolean).join(', ') || '—'}</td>
                <td>{customer.bookingCount}</td>
              </tr>
            ))}
            {customers.length === 0 ? <tr><td colSpan={4}>No customers have signed in yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
