import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoHorizontal from "@/assets/logo-horizontal.webp";
import { useAuth } from "@/contexts/AuthContext";

export const PublicHeader = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAccess = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="fixed top-0 w-full bg-card/95 backdrop-blur-sm border-b border-border z-50">
      <div className=" mx-auto px-4 sm:px-6 lg:px-24">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src={logoHorizontal}
              alt="Increscendo Fintech"
              className="h-8 sm:h-10 w-auto"
              width={273}
              height={50}
              loading="eager"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</Link>
            <Button onClick={handleAccess} size="sm">
              Acceder
            </Button>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <nav className="flex flex-col px-4 py-4 space-y-3">
            <Link
              to="/contacto"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contacto
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};