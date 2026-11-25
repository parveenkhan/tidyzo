import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { loadDashboard } from '../../Redux/Actions/Workspace.Action';
import { formatStatus, inr } from '../../Utils/format';

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const { stats, recent, loading, error } = useAppSelector((state) => state.workspace);

  useEffect(() => { dispatch(loadDashboard()); }, [dispatch]);

  return (
    <>
      <h2>Today</h2>
      {error ? <p className="error">{error}</p> : null}
      <section className="stats">
        <article className="stat"><span>Customers</span><b>{stats.customers}</b></article>
        <article className="stat"><span>Bookings</span><b>{stats.bookings}</b></article>
        <article className="stat"><span>Pending</span><b>{stats.pending}</b></article>
        <article className="stat"><span>Scheduled today</span><b>{stats.today}</b></article>
      </section>
      <section className="table-wrap">
        <table>
          <thead><tr><th>Service</th><th>Customer</th><th>When</th><th>Status</th><th>Price</th></tr></thead>
          <tbody>
            {recent.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.serviceName}</td>
                <td>{booking.customerName}<div className="muted">{booking.customerMobile}</div></td>
                <td>{booking.date} {booking.time}</td>
                <td><span className={`badge ${booking.status}`}>{formatStatus(booking.status)}</span></td>
                <td>{inr(booking.price)}</td>
              </tr>
            ))}
            {!loading && recent.length === 0 ? <tr><td colSpan={5}>No bookings yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
