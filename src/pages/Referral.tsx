import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Referral = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem('ref_code', code.toLowerCase());
    }
    navigate('/login?tab=signup', { replace: true });
  }, [code, navigate]);

  return null;
};

export default Referral;
