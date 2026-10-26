# Área de clientes (rediseño)

| Carpeta | Qué hay |
|---|---|
| `lib/api.ts` | Todas las llamadas a Supabase e increscendo-api, cada una con su modo demostración |
| `lib/rules.ts` | Reglas de negocio: qué puede hacer el cliente según su identidad, membresía e invitación |
| `lib/demo.ts` | Datos de ejemplo. Se cambia el escenario con `?demo=nuevo`, `?demo=miembro` o `?demo=invitado`, o desde Perfil |
| `components/ui.tsx` | Kit visual: inputs, botones, tarjetas, hojas, stepper |
| `components/ClientLayout.tsx` | Menú lateral en escritorio y barra inferior en móvil |
| `components/AuthShell.tsx` | Login y registro con panel de marca |
| `pages/` | Una pantalla por ruta |

Rutas: `/auth` (login, `?mode=register` para el registro), `/dashboard`,
`/identidad`, `/memberships`, `/membership-checkout?plan=`, `/servicios`,
`/servicios-recargas`, `/history`, `/mi-cuenta`, `/payment-methods`,
`/notifications`, `/my-loans`, `/my-loans/:id`, `/prestamos/solicitar`,
`/tarjeta`, `/tarjeta/solicitar`, `/tarjeta/invitacion/:token`.

Las rutas viejas (`/loan-request`, `/loan-process` y `/service-selection`) redirigen a las nuevas.

Contratos con el backend: `docs/CONTRATOS_BACKEND_CLIENTE.md`.
