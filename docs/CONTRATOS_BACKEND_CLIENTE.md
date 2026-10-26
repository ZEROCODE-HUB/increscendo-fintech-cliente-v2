# Área de clientes: qué espera el front del backend

El rediseño vive en `src/client/`. Toda la comunicación con Supabase y con
`increscendo-api` está en **`src/client/lib/api.ts`**: cada función tiene su
camino real y su camino de demostración. Si un endpoint cambia, solo se toca esa
función; las pantallas no.

Prioridad: **P0** = seguridad, aplicar antes de publicar · **P1** = entrega de diciembre · **P2** = después.

---

## 0. Seguridad de la tabla `users` (P0)

La política `users_update_own` (migración 002) deja que un cliente actualice
**cualquier** columna de su propia fila. Hoy un cliente podría:

- poner `role = 'admin'` y entrar al panel,
- escribir `metadata.backoffice_role`, `metadata.loan_eligible` o `metadata.kyc.status = 'verificado'`.

**Incluida:** `migrations/033_protect_user_privileged_fields.sql`. Es un
trigger que conserva esos campos si quien actualiza no es personal de
backoffice. Solo deja que el cliente pase su KYC a `por_verificar` al subir
documentos. Revísenla y aplíquenla antes de publicar.

## 1. Identidad (KYC): ya funciona con lo que existe (P1)

- Bucket `documents`, ruta `kyc/{userId}/{doc}_{timestamp}.{ext}`.
- INE frente y reverso → `users.ine_front_url` / `ine_back_url`. CURP → `curp_url`.
- Constancia fiscal → `users.metadata.rfc_url`. Comprobante de domicilio → `metadata.address_proof_url`.
- Cuando están los 4 obligatorios, el front escribe `metadata.kyc = { status: 'por_verificar', submittedAt }`. El admin lo cambia a `verificado` o `rechazado` con `reasonCode` y `reasonMessage`. El cliente ve `reasonMessage` tal cual, así que debe estar redactado para él.
- Si el admin usa `reasonCode` del catálogo (`INE_ILEGIBLE`, `INE_VENCIDA`, `RFC_INVALIDO`, `DATOS_NO_COINCIDEN`…), el front marca en rojo qué documento volver a subir.

## 2. Registro: datos extra (P1)

El registro manda en `options.data` de `supabase.auth.signUp`, además de lo de
antes: `birth_date`, `address`, `address_parts {calle, numero, interior, colonia, ciudad, estado, cp, pais}`,
`person_type` y `terms_accepted_at`.

El trigger actual (029) solo copia nombre, apellidos y teléfono. Por eso, en el
**primer inicio de sesión** el front copia el resto a `users` (`address`,
`birth_date`, `terms_accepted` y `metadata.address_parts` / `terms_accepted_at`).
Si prefieren hacerlo en el trigger, se puede quitar `syncSignupMetadata()`.

**TyC obligatorios:** a quien no tenga `metadata.terms_accepted_at` ni
`terms_accepted = true`, se le muestra un modal que no se puede cerrar hasta que acepte.

## 3. Pago de membresía con link, SPEI y efectivo (P1, nuevo)

`/acquire-membership` solo cobra la tarjeta predeterminada. Para los demás métodos el front llama:

```
POST /membership-payment-reference
{ user_id, membership_plan_id, method: 'link' | 'spei' | 'cash', coupon_code?, invoice?: { rfc, fiscalAddress } }
→ { ok: true, data: { reference, url?, clabe?, expires_at } }
```

- Crear la orden en Conekta (`payment_link`, `spei` u `cash`), registrar `user_memberships.status = 'pending'` y una fila en `invoices` con `status = 'pending'`.
- Webhook `order.paid`: membresía `active` (con `started_at` / `expires_at`) e invoice `paid`.
- Mientras no exista (404), el cliente ve: "Este método aún no está disponible. Paga con tarjeta por ahora."

**Factura:** con tarjeta, el front ahora también manda `rfc` y `fiscal_address` a
`/acquire-membership`. Antes se pedían y no se enviaban. Guárdenlos en `invoices.rfc` y `invoices.fiscal_address`.

**Tarjeta elegida:** si el cliente elige una tarjeta que no es la principal, el
front llama primero a `/set-default-card` y después a `/acquire-membership`.

## 4. Contrato de membresía por SignNow (P1)

Es el mismo endpoint que el punto 6 del admin: `POST /signnow-membership-invite { user_id, recipient_email, membership_plan_id }`.
El front lo llama al aceptar el contrato en el checkout. No bloquea el pago, y si falla no se le muestra error al cliente.

## 5. Préstamos (P1)

- Visible para todos los clientes con sesión (`VITE_LOANS_MODE=all`, por defecto). Con `VITE_LOANS_MODE=invited` solo lo ven quienes tienen `users.metadata.loan_eligible === true`. Con `all`, ese campo se muestra como "Preaprobado".
- Para solicitar se requiere identidad `verificado` y membresía activa.
- Pantalla `/prestamos` (presentación + simulador + requisitos) y proceso en `/prestamos/solicitar`: Bienvenida → Requisitos → Monto y plazo → Cuenta → Revisión.
- La solicitud usa el mismo contrato de antes (`POST /belvo/loan-request`, FormData).
  - `personalData` sale del perfil y ya no se reenvían archivos.
  - `paymentMethodId` es la cuenta bancaria elegida.
- **Enrutamiento:** BBVA Bancomer va por Druo y el resto por Belvo. Lo decide el backend según `depositData.bank`. Al cliente no se le dice qué proveedor se usa (pedido de Héctor, punto 28).
- **Firma:** si guardan el enlace de SignNow en `loans.metadata.sign_url`, el cliente ve el botón "Firmar ahora". "Ya firmé mi contrato" sigue llamando a `user_sign_loan`.
- **Rechazo:** se muestra `loans.metadata.rejection.message`.
- **Calendario:** `GET /belvo/loans/:id/installments`. Para el pago anticipado: `POST /belvo/loans/:id/payment-request { installmentNumbers }`. El cliente solo puede adelantar cuotas en orden.
- La tarjeta de inicio usa `metadata.next_payment_date` y `metadata.paid_amount`. Igual que en el admin, conviene mantenerlos actualizados por webhook.

## 6. Movimientos (P1)

Hoy se arman con `invoices` + `loan_disbursements` + `/belvo/loans/payment-requests`.
Cuando exista la vista `movements` del admin, `listMovements()` pasa a ser un
`select * from movements where user_id = auth.uid()`. Hace falta RLS de lectura para el dueño.

## 7. Tarjeta OneCard (P2, Fase 2)

Se activa con `VITE_FEATURE_CARDS=true`. Si está apagada, "Mi tarjeta" muestra "Próximamente".

| Pantalla | Endpoint |
|---|---|
| Estado de la tarjeta del cliente | `GET /onecard/me` → `{ status: none, invited, requested, active o blocked; kind, last4, balance, creditLine, holder, expiry, onlinePurchases, movements[] }` |
| Solicitud (6 pasos) | `POST /onecard/requests { kind, holder, address? }` |
| Bloquear o desbloquear, compras en línea | `PATCH /onecard/me { blocked?, onlinePurchases? }` |
| Invitación por correo | Enlace a `/tarjeta/invitacion/:token`. Validar el token del lado servidor y poner `status = 'invited'`. |

Requisitos: identidad `verificado` + membresía activa.

## 8. Servicios (Tekae)

Sin cambios: `POST /tekae-token` → `finalUrl`, embebido con "Volver a Increscendo" fijo.
Si a los 20 s no carga, se ofrece "Reintentar".

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Obligatorias en producción. Sin ellas la app arranca en modo demostración. |
| `VITE_CONEKTA_PUBLIC_KEY` | Tokenización de tarjetas (llave **pública**). |
| `VITE_DEMO_MODE=true` | Fuerza el modo demostración aunque haya credenciales. |
| `VITE_FEATURE_CARDS=true` | Enciende "Mi tarjeta" (Fase 2). |
| `VITE_LOANS_MODE` | `all` (por defecto) o `invited`. |
