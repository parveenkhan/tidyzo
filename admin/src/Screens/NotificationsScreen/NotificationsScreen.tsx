import { FormEvent, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { loadBookings, loadCustomers, loadNotifications, sendNotification } from '../../Redux/Actions/Workspace.Action';

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const { customers, bookings, notifications, saving, error, notice } = useAppSelector((state) => state.workspace);
  const [customerId, setCustomerId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [title, setTitle] = useState('Update from TidyZo');
  const [body, setBody] = useState('');

  useEffect(() => {
    dispatch(loadCustomers());
    dispatch(loadBookings(''));
    dispatch(loadNotifications());
  }, [dispatch]);

  const related = bookings.filter((booking) => booking.customerId === customerId);

  function submit(event: FormEvent) {
    event.preventDefault();
    dispatch(sendNotification({ customerId, title, body, bookingId: bookingId || undefined }));
    setBody('');
  }

  return (
    <>
      <h2>Notifications</h2>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="ok">{notice}</p> : null}
      <div className="grid-2">
        <form className="card form-stack" onSubmit={submit}>
          <label>Customer
            <select value={customerId} onChange={(event) => { setCustomerId(event.target.value); setBookingId(''); }} required>
              <option value="">Choose</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.mobile}</option>)}
            </select>
          </label>
          <label>Booking
            <select value={bookingId} onChange={(event) => setBookingId(event.target.value)}>
              <option value="">None</option>
              {related.map((booking) => <option key={booking.id} value={booking.id}>{booking.serviceName} · {booking.date}</option>)}
            </select>
          </label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>Message<textarea value={body} onChange={(event) => setBody(event.target.value)} required /></label>
          <button className="primary" type="submit" disabled={saving || !customerId}>Send to customer</button>
        </form>
        <section className="table-wrap">
          <table>
            <thead><tr><th>Recent</th></tr></thead>
            <tbody>
              {notifications.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div>{item.body}</div>
                    <div className="muted">{item.customerName} · {item.customerMobile} · {item.pushStatus}</div>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 ? <tr><td>No notifications sent yet.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
