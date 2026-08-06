import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useRole = () => {
  const { selectedGroup, user } = useContext(AuthContext);

  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);

  if(window.location.pathname === '/groups/create') {
    return {  
      isOwner: false,
      isAdmin: false,
      loading: false
    }
  }

  useEffect(() => {
    if(!selectedGroup) {
      setRole('MEMBER');
      setLoading(true);
      return;
    }
    
    if(selectedGroup.role) {
      setRole(selectedGroup.role);
    } else {
      setRole('MEMBER');
    }
    
    setLoading(false);
  }, [selectedGroup, user]);

  return {
    role,
    isOwner: role === 'OWNER',
    isAdmin: role === 'ADMIN',
    loading
  }
}

export default useRole;