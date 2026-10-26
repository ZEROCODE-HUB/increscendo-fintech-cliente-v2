const CancelacionTerminos = () => {
  return (
    <div className="min-h-screen bg-background pt-20 sm:pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Términos de Cancelación</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>El Cliente podrá solicitar la cancelación de su cuenta y de los servicios asociados en cualquier momento mediante solicitud escrita o a través de los canales autorizados por INCRESCENDO FINTECH.</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">1. Verificación y saldos</h3>
              <p>La cancelación surtirá efectos una vez que se verifique la identidad del Cliente y se confirme que no existen saldos pendientes, operaciones en tránsito o controversias abiertas.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">2. Retiro de fondos</h3>
              <p>El Cliente deberá retirar o transferir previamente los fondos disponibles en su cuenta.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">3. Rechazo temporal</h3>
              <p>INCRESCENDO FINTECH podrá rechazar temporalmente la cancelación cuando existan obligaciones legales, requerimientos de autoridades competentes o investigaciones relacionadas con la cuenta.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">4. Deshabilitación de acceso</h3>
              <p>Una vez concluido el proceso de cancelación, el acceso a la plataforma y a los servicios asociados quedará deshabilitado.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">5. Obligaciones previas</h3>
              <p>La cancelación no libera al Cliente de las obligaciones generadas con anterioridad a la fecha efectiva de cancelación.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">6. Conservación de información</h3>
              <p>INCRESCENDO FINTECH conservará la información y documentación del Cliente durante los plazos exigidos por la legislación aplicable.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelacionTerminos;
