# Reservas del local, panel de admin y nueva página de reservas

Fecha: 2026-10-08 (sesión 04). Diseño acordado en el chat, por partes. El usuario
pidió implementarlo sin revisar el spec escrito ("hacelo y luego vamos viendo").

## Objetivo

1. El admin gestiona todo desde `/admin`: ver, **crear**, confirmar, rechazar,
   cancelar y mover reservas. No usa `/reservas` ni `/mis-reservas`.
2. El admin carga reservas que entran por teléfono o WhatsApp, a nombre de un
   cliente que no tiene cuenta.
3. `/reservas` deja de verse como una maqueta generada por IA. El resto del sitio
   no cambia: el pase de diseño general se descartó (PR #5 cerrado).

## Parte 1 — Base (migración `20261008130000_reservas_del_local.sql`)

- `reservas.origen text not null default 'web'`, con `check (origen in ('web', 'local'))`.
- `reservas.usuario_id` pasa a aceptar `null`, con
  `check ((origen = 'web') = (usuario_id is not null))`: las `web` tienen cliente,
  las `local` no.
- `reservas.mail text` (opcional, solo para las `local`): el mail del cliente que
  cargó el admin. El trigger `validar_contacto` valida su formato y largo (máximo
  254), y una reserva `web` no puede tenerlo.
- Personas: `web` de 1 a 6 y `local` de 1 a 40. El check reemplaza al de 1 a 6.
- Siguen valiendo para las dos: franjas, fecha futura, días bloqueados, nombre,
  teléfono y comentarios (triggers existentes).
- La regla de una reserva activa por día no cambia. Las `local` no la tocan,
  porque su `usuario_id` es nulo.
- RLS: un cliente solo inserta `origen = 'web'`, a su nombre y pendiente. El admin
  ya podía insertar cualquier fila; desde el panel crea `local` y `confirmada`.
- **Cancelar desde la web: hasta 1 hora antes** (antes eran 2). Cambia
  `cancelar_reserva()`, y su mensaje pasa a decir "menos de 1 hora".
- Avisos (`notificar_reserva`): si la reserva no tiene `usuario_id` ni `mail`,
  no se llama a la Edge Function.

## Parte 1b — Mails (Edge Function)

- `Reserva` suma `origen` y `mail`.
- Reserva `local` nueva con mail: al cliente le llega "Tu reserva está
  confirmada". Al admin no le llega nada, porque la cargó él.
- Reserva `local`: los cambios de estado y de horario le llegan al cliente igual
  que en las `web`. Los avisos para el admin no se mandan.
- En las `local`, la plantilla no lleva el link a "Mis reservas" (no hay cuenta)
  y deriva a WhatsApp.
- El mail del cliente sale de `reserva.mail` si existe; si no, de Auth, como hoy.

## Parte 2 — Navegación y panel

- Navbar del admin: Inicio, Carta, Nosotros y el botón **Panel**, en lugar de
  "Reservar". Sin "Mis reservas", "Reservar" ni el link "Admin" suelto.
- `/reservas` y `/mis-reservas` con sesión de admin redirigen a `/admin`. Si
  vienen con `?local=`, se conserva para que el formulario de nueva reserva lo
  tenga elegido.
- Panel: botón **Nueva reserva**, que abre un formulario en la misma página con
  salón, fecha, hora (franjas libres), personas (1–40), nombre, teléfono, mail
  (opcional) y comentarios. Guarda una reserva `local` y `confirmada`, y la lista
  se actualiza por tiempo real.
- Las reservas `local` muestran "Cargada en el local" y su mail si lo tienen.
- `obtenerMisReservas()` filtra por el usuario: hoy, para el admin, devolvía
  todas las reservas por la RLS.

## Parte 3 — `/reservas` para clientes

- Una sola columna, sin cajas ni sombras. Tres grupos: **Salón** (las fotos de
  cada salón como opciones), **Día y hora** (fecha, hora, personas) y **Tus
  datos** (nombre, teléfono, comentarios).
- Personas: se pueden elegir más de 6, y entonces el botón de enviar cambia a
  **"Reservar por WhatsApp"** con el logo. Abre WhatsApp con un mensaje armado
  con los campos completos, por ejemplo: "Hola! Me gustaría hacer una reserva en
  La Posta Parrilla para el viernes 9 de octubre a las 20:30, a nombre de Ana,
  para 8 personas." Los campos vacíos se omiten. Si el local no tiene WhatsApp,
  el botón no aparece y se deriva a Instagram.
- Texto junto al botón: "La reserva queda pendiente hasta que la confirmemos
  desde el local. Podés gestionarla desde "Mis reservas" hasta 1 hora antes.
  Guardamos la mesa hasta 15 minutos pasada la hora."
- Al final: "¿Preferís hablar con alguien?", con WhatsApp del salón elegido e
  Instagram.
- Sin sesión: los dos salones y "Para pedir una mesa, ingresá con tu cuenta de
  Google: así ves y cancelás tus reservas desde acá." + botón **Ingresar con
  Google**.
- Textos: "Pedido de reserva enviado" en vez de "¡Recibimos tu pedido de
  reserva!"; comentarios con el ejemplo "Alergias, celíacos, silla para bebé,
  cumpleaños…"; "Salón" en vez de "¿En qué salón?".

## Tests

- `node --test`:
  - personas según el origen;
  - `validarMail`;
  - `mensajeWhatsappReserva` (campos vacíos omitidos);
  - 1 hora para cancelar.
- Deno (`mensajes.test.ts`): reserva `local` con y sin mail, nueva y con cambios.
- pgTAP (`04_reservas_del_local.test.sql`):
  - el admin carga varias `local` el mismo día y local;
  - 12 personas `local` sí, `web` no;
  - un cliente no crea `local`;
  - `local` en un día bloqueado, rechazada;
  - una `web` no lleva mail;
  - las viejas quedan `web`.

  El test 01 pasa de 2 horas a 1 hora.

## Fuera de alcance

- El rediseño general del sitio (descartado).
- Editar el mail o los datos de una reserva ya cargada (se puede sumar después).
