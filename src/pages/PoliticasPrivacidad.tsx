import { PublicHeader } from "@/components/layouts/PublicHeader";
import { PublicFooter } from "@/components/layouts/PublicFooter";

const PoliticasPrivacidad = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="pt-20 sm:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-6">Políticas de Privacidad</h1>

          <div className="text-sm text-foreground/90 space-y-4">
            <p>
              Con fundamento en los artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de Particulares hacemos de su conocimiento que <strong>Increscendo Fintech MX, SAPI de CV</strong>, con domicilio en <strong>Montes Urales 755, Colonia Lomas de Chapultepec, Alcaldía: Miguel Hidalgo, CDMX CP: 11000</strong>, es responsable de recabar los datos personales de usted, incluyendo los sensibles, que actualmente o en el futuro obren en nuestras bases de datos, serán tratados y/o utilizados por: Increscendo Fintech y/o nuestras empresas filiales y/o aquellos terceros que, por la naturaleza de sus trabajos o funciones tengan la necesidad de tratar y/o utilizar sus datos personales; con el propósito de cumplir aquellas obligaciones que se derivan de la relación jurídica existente entre usted como titular de los datos personales y las empresas antes señaladas.
            </p>

            <p>
              Sus datos personales se encuentran bajo la protección de las medidas tecnológicas y administrativas dispuestas por la legislación vigente.
            </p>

            <p>
              Su información personal será utilizada para proveer los servicios, productos e información que ha solicitado, comunicarle sobre cambios en los mismos y evaluar la calidad del servicio que le brindamos.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-primary mt-8 mb-4">Datos personales requeridos</h2>

            <p>Para las finalidades antes mencionadas, requerimos obtener los siguientes datos personales:</p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre completo</li>
              <li>Teléfono fijo y/o celular</li>
              <li>Correo electrónico</li>
              <li>Dirección</li>
              <li>RFC y/o CURP</li>
              <li>ID de Facebook, Twitter y/o LinkedIn</li>
            </ul>

            <p>
              La protección de sus datos personales es de máxima prioridad para nosotros, es por ello que contamos con equipos físicos y sistemas especializados para resguardar su información, contamos además con políticas, procedimientos, estándares y guías que están enfocadas a la seguridad de la información y que tienen como objetivo limitar y evitar la divulgación de su información, todos sus datos los tenemos clasificados y tratados como confidenciales.
            </p>

            <p>
              Increscendo Fintech MX, SAPI de CV podrá transferir los datos personales que obren en sus bases de datos a cualquiera de las empresas filiales e incluso a terceras personas, nacionales o extranjeras, salvo que los titulares respectivos manifiesten expresamente su oposición, en términos de lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-primary mt-8 mb-4">Derechos ARCO</h2>

            <p>
              Para ejercer sus derechos de acceso, rectificación, cancelación u oposición (ARCO), a partir del 6 de enero 2012, usted podrá acudir a nuestras oficinas ubicadas en la dirección antes indicada mediante solicitud que debe contener lo siguiente:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre.</li>
              <li>Documentos que acrediten su identidad.</li>
              <li>Descripción clara y precisa de los datos personales respecto de los que se busca ejercer sus derechos ARCO.</li>
              <li>Incluir cualquier elemento o documento que facilite la localización de los datos personales de que se traten.</li>
              <li>Firma autógrafa del titular, así como un domicilio u otro medio para comunicarle la respuesta a su solicitud.</li>
            </ul>

            <p>
              La respuesta a su solicitud, se realizará en un plazo máximo de veinte días hábiles contados después de la fecha en que se recibió la solicitud correspondiente, a efectos de que, si resulta procedente, se haga efectiva la misma dentro de los quince días siguientes a la fecha de que se comunica la respuesta.
            </p>

            <p>
              En caso de que no desee de recibir mensajes promocionales de nuestra parte, puede enviarnos su solicitud por medio de la dirección electrónica:
            </p>

            <p className="font-semibold text-primary">
              privacidad@increscendofintech.com
            </p>

            <p>
              Se entenderá que el titular consiente tácitamente el tratamiento de sus datos, cuando habiéndose puesto a su disposición el aviso de privacidad no manifieste su oposición.
            </p>

            <p>
              Increscendo Fintech MX, SAPI de CV se reserva el derecho de cambiar, modificar, complementar y/o alterar el presente aviso, en cualquier momento, en cuyo caso se hará de su conocimiento a través de cualquiera de los medios que establece la legislación en la materia.
            </p>

            <p className="text-sm text-muted-foreground mt-8">
              <strong>Fecha última actualización:</strong> Abril 01 2026
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PoliticasPrivacidad;