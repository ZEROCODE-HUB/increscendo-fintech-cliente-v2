import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBusinesswoman from "@/assets/hero-businesswoman.webp";

const UsuarioNuevoMarketing = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <section className="w-full rounded-2xl bg-gradient-to-br from-[hsl(216,45%,12%)] via-[hsl(216,45%,15%)] to-[hsl(216,45%,10%)] py-12 md:py-16 lg:py-20 px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-block">
              <span className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full">
                Fintech Premium
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Obtén tu membresía{" "}
              <span className="text-[hsl(216,80%,55%)] italic">Increscendo</span>
            </h1>

            <p className="text-base lg:text-lg text-gray-300 max-w-lg mx-auto md:mx-0">
              Descubre los beneficios exclusivos que impulsan tu éxito financiero.
              Seguridad, crecimiento y confianza en cada paso.
            </p>

            <div className="flex justify-center md:justify-start">
              <Button
                onClick={() => navigate("/memberships")}
                className="bg-[hsl(216,80%,55%)] hover:bg-[hsl(216,80%,50%)] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Ver Planes
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[hsl(216,80%,55%)/0.2]">
              <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(216,80%,55%)/0.3] via-transparent to-[hsl(216,80%,55%)/0.3] rounded-3xl blur-xl opacity-60" />

              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <img
                  src={heroBusinesswoman}
                  alt="Profesional de negocios sonriendo"
                  className="w-full max-w-sm lg:max-w-md h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UsuarioNuevoMarketing;
