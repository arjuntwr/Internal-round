import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold mb-2">Unauthorized</h1>
      <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
      <div className="flex gap-4">
        <Link to="/" className="underline">Go Home</Link>
        <Link to="/login" className="underline">Sign In</Link>
      </div>
    </div>
  );
};

export default Unauthorized;
