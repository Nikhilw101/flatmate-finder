import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useAuth();
  
  // Base links
  const links = [
    { to: '/', icon: <Home size={22} />, label: 'Home' },
    { to: '/listings', icon: <Search size={22} />, label: 'Explore' },
  ];

  // Auth specific links
  if (user) {
    links.push({ to: '/messages', icon: <MessageSquare size={22} />, label: 'Messages' });
    links.push({ to: `/${user.role.toLowerCase()}/dashboard`, icon: <User size={22} />, label: 'Profile' });
  } else {
    links.push({ to: '/login', icon: <User size={22} />, label: 'Sign in' });
  }

  return (
    <nav className="bottom-nav">
      {links.map((link) => (
        <NavLink 
          key={link.to} 
          to={link.to} 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          end={link.to === '/'}
        >
          {link.icon}
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
