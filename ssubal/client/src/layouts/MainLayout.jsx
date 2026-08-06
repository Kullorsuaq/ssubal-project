import { Outlet } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar'
import useAuth from '../hooks/useAuth';

function MainLayout() {
  const { isLogin } = useAuth();

  return (
    <div className="app-wrapper">
      <div className="content-area">
        <Outlet /> 
      </div> 
      { isLogin && <NavigationBar /> }
    </div>
  )
}

export default MainLayout;