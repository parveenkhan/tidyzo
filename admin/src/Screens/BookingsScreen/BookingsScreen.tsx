import { FormEvent, useEffect, useState } from 'react';
import { Booking } from '../../Assets/Types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { loadBookings, loadProfessionals, updateBooking } from '../../Redux/Actions/Workspace.Action';
import { STATUSES, formatStatus, inr } from '../../Utils/format';

export default function BookingsScreen() {
  const dispatch = useAppDispatch();
  const { bookings, professionals, saving, error, notice } = useAppSelector((state) => state.workspace);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [nextStatus, setNextStatus] = useState('approved');
  const [professionalId, setProfessionalId] = useState('');

  useEffect(() => {
    dispatch(loadBookings(status));
    dispatch(loadProfessionals());
  }, [dispatch, status]);

  function open(booking: Booking) {
    setSelected(booking);
    setNextStatus(booking.status);
    setProfessionalId(booking.professionalId || '');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    dispatch(updateBooking({ id: selected.id, status: nextStatus, professionalId: professionalId || null }));
    setSelected(null);
  }

  return (
    <>
      <div className="row">
        <h2>Bookings</h2>
        <label>Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All</option>
            {STATUSES.map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}
          </select>
        </label>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="ok">{notice}</p> : null}
      <section className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Service</th><th>Slot</th><th>Address</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.customerName}<div className="muted">{booking.customerMobile}</div></td>
                <td>{booking.serviceName}<div className="muted">{inr(booking.price)}</div></td>
                <td>{booking.date}<div className="muted">{booking.time}</div></td>
                <td>{booking.addressLine}, {booking.city} {booking.pincode}</td>
                <td>
                  <span className={`badge ${booking.status}`}>{formatStatus(booking.status)}</span>
                  {booking.professionalName ? <div className="muted">{booking.professionalName}</div> : null}
                </td>
                <td><button className="ghost" type="button" onClick={() => open(booking)}>Manage</button></td>
              </tr>
            ))}
            {bookings.length === 0 ? <tr><td colSpan={6}>No bookings in this view.</td></tr> : null}
          </tbody>
        </table>
      </section>
      {selected ? (
        <div className="modal-back" onClick={() => setSelected(null)}>
          <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
            <h2>{selected.serviceName}</h2>
            <p className="muted">{selected.customerName} · {selected.date} {selected.time}</p>
            {selected.notes ? <p>Note: {selected.notes}</p> : null}
            <label>Status
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {STATUSES.map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}
              </select>
            </label>
            <label>Professional
              <select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
                <option value="">Unassigned</option>
                {professionals.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.skill} · {person.phone}</option>)}
              </select>
            </label>
            <div className="actions">
              <button className="primary" disabled={saving} type="submit">Save and notify</button>
              <button className="ghost" type="button" onClick={() => setSelected(null)}>Close</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
