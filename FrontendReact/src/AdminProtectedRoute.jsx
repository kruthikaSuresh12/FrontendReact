import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin token exists in cookies
    const hasAdminToken = document.cookie.includes('admin_token');

    if (!hasAdminToken) {
      // No admin token → redirect to admin login
      navigate('/admin-login', { replace: true });
    }
  }, [navigate]);

  // Simple loading state
  return (
    <div className="admin-protected-route">
      {document.cookie.includes('admin_token') ? children : null}
    </div>
  );
};

export default AdminProtectedRoute;