import { FormEvent, useEffect, useState } from 'react';
import { Service, ServiceInput } from '../../Assets/Types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { deleteService, loadServices, saveService } from '../../Redux/Actions/Workspace.Action';
import { inr } from '../../Utils/format';

const empty: ServiceInput = {
  name: '',
  category: 'Cleaning',
  description: '',
  price: 499,
  durationMin: 60,
  imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
  active: true,
};

export default function ServicesScreen() {
  const dispatch = useAppDispatch();
  const { services, saving, error, notice } = useAppSelector((state) => state.workspace);
  const [draft, setDraft] = useState<ServiceInput & { id?: string } | null>(null);

  useEffect(() => { dispatch(loadServices()); }, [dispatch]);

  function edit(service?: Service) {
    setDraft(service ? {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price,
      durationMin: service.durationMin,
      imageUrl: service.imageUrl,
      active: service.active,
    } : empty);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    dispatch(saveService(draft));
    setDraft(null);
  }

  return (
    <>
      <div className="row">
        <h2>Services</h2>
        <button className="primary" type="button" onClick={() => edit()}>Add service</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="ok">{notice}</p> : null}
      <section className="table-wrap">
        <table>
          <thead><tr><th>Service</th><th>Price</th><th>Visible</th><th></th></tr></thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td><strong>{service.name}</strong><div className="muted">{service.category} · {service.durationMin} min</div></td>
                <td>{inr(service.price)}</td>
                <td>{service.active ? 'Yes' : 'Hidden'}</td>
                <td className="actions">
                  <button className="ghost" type="button" onClick={() => edit(service)}>Edit</button>
                  <button className="danger" type="button" onClick={() => {
                    if (window.confirm(`Remove ${service.name}?`)) dispatch(deleteService(service.id));
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {draft ? (
        <div className="modal-back" onClick={() => setDraft(null)}>
          <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
            <h2>{draft.id ? 'Edit service' : 'New service'}</h2>
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
            <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required /></label>
            <label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required /></label>
            <label>Price (INR)<input type="number" min={1} value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} required /></label>
            <label>Duration (minutes)<input type="number" min={15} value={draft.durationMin} onChange={(event) => setDraft({ ...draft, durationMin: Number(event.target.value) })} required /></label>
            <label>Image URL<input value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} required /></label>
            <label className="check"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Visible to customers</label>
            <div className="actions">
              <button className="primary" type="submit" disabled={saving}>Save</button>
              <button className="ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
