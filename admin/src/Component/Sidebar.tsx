import { NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../Redux/hooks';
import { logout } from '../Redux/Actions/Auth.Action';

const links = [
  ['/', 'Dashboard'],
  ['/bookings', 'Bookings'],
  ['/services', 'Services'],
  ['/customers', 'Customers'],
  ['/notifications', 'Notifications'],
];

export function Sidebar() {
  const admin = useAppSelector((state) => state.auth.admin);
  const dispatch = useAppDispatch();
  return (
    <aside className="side">
      <div>
        <div className="brand">TIDYZO</div>
        <strong>{admin?.name || 'Admin'}</strong>
      </div>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
        ))}
      </nav>
      <button className="ghost" type="button" onClick={() => dispatch(logout())}>Log out</button>
    </aside>
  );
}
