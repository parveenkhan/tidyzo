import { FormEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { login } from '../../Redux/Actions/Auth.Action';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  const [email, setEmail] = useState('admin@tidyzo.app');
  const [password, setPassword] = useState('Admin@12345');

  function submit(event: FormEvent) {
    event.preventDefault();
    dispatch(login({ email, password }));
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">TIDYZO</div>
        <h1>Admin desk</h1>
        <p className="muted">Review bookings, services, and customer alerts.</p>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" /></label>
        <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
