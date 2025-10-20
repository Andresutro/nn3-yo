# Pelea de Castillos a lo Maldito – Backend

Backend en Node.js + Koa + Sequelize para el juego por turnos "Pelea de
Castillos a lo Maldito". Esta entrega implementa las reglas del tablero en el
servidor, el modelo de datos en PostgreSQL y la API JSON que describe cada
acción del juego.

## Requisitos

- Node.js 18+
- PostgreSQL 13+
- `npm` o `yarn`

## Configuración rápida

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar variables de entorno creando un archivo `.env` en la raíz del
   proyecto. Variables mínimas:

   ```dotenv
   DB_USERNAME=<usuario_pg>
   DB_PASSWORD=<password_pg>
   DB_HOST=127.0.0.1
   DB_DATABASE=pelea_castillos
   DB_PORT=5432
   PORT=3000
   ```

   > También puedes usar `DB_NAME` en lugar de `DB_DATABASE`; si tu proveedor
   > entrega una URL completa (por ejemplo Render), define `DATABASE_URL` y el
   > backend la utilizará automáticamente.

3. Crear base de datos y ejecutar migraciones:

   ```bash
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

   Si se requieren datos iniciales, crear archivos en `src/seeders/` y ejecutar
   `npx sequelize-cli db:seed:all`.

4. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   Para producción/local sin hot-reload: `npm start`.

## Despliegue en Render (PaaS sugerida)

1. Crear un servicio *Web Service* nuevo en Render apuntando al repositorio.
2. Configurar **Build Command**: `npm install && npx sequelize-cli db:migrate`.
3. Configurar **Start Command**: `npm start`.
4. Definir variables de entorno equivalentes a las del archivo `.env`. Render
   provee `DATABASE_URL` si se usa una base PostgreSQL administrada; en ese caso
   agregar la clave `use_env_variable` en `src/config/config.js` o definir las
   variables individuales.

## Documentación de la API

- Especificación OpenAPI: [`docs/openapi.yaml`](docs/openapi.yaml)
- Colección de jugadas ordenadas para la corrección: [`docs/jugadas-ejemplo.json`](docs/jugadas-ejemplo.json)

### Endpoints principales

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/usuarios` | GET/POST | CRUD básico de usuarios con validaciones de email y duplicados. |
| `/salas` | GET/POST/PUT/DELETE | Administrar salas y su estado. |
| `/salas/{id}/participantes` | GET/POST | Añadir jugadores/espectadores y consultar participantes. |
| `/salas/{id}/participantes/{participanteId}` | DELETE | Retirar un participante. |
| `/salas/{salaId}/partidas` | POST | Crea una partida en fase de despliegue (requiere 2 jugadores). |
| `/partidas/{id}` | GET | Estado completo de la partida (jugadores, tablero, turnos). |
| `/partidas/{id}/despliegue` | POST | Posicionar campamentos (C1/C2/C3) respetando la mitad propia. |
| `/partidas/{id}/turnos` | POST | Ejecutar un turno: `PASAR` o `DISPARAR` con la munición deseada. |
| `/partidas/{id}/suministro` | POST | Solicitar Suministro de Emergencia si el jugador es elegible. |

### Resumen de protocolo de jugadas

- **Despliegue**: cada jugador posiciona exactamente un campamento de cada tipo
  (`C1`, `C2`, `C3`) dentro de su mitad. El servidor valida duplicados, casillas
  destruidas y solapamiento.
- **Inicio de turno**: el servidor genera automáticamente la pólvora según los
  campamentos vivos (`+1`, `+2`, `+3`) y disminuye el cooldown del Suministro de
  Emergencia.
- **Acciones**:
  - `PASAR`: acumula pólvora. Si fue un timeout (`autoPasar=true`), aumenta el
    contador de inactividad. A las 3 inactividades consecutivas, el jugador
    pierde por abandono.
  - `DISPARAR`: fabrica la munición, descuenta pólvora y aplica la plantilla en
    la mitad rival. Se registran impactos, destrucción de campamentos y eventos
    de cúpula (`DOME`). El servidor controla la condición de victoria y la
    secuencia de respuesta del jugador inicial.
- **Suministro de Emergencia (SE)**: disponible cuando la diferencia de casillas
  destruidas es ≥ 8 o se han perdido ≥ 2 campamentos. Probabilidad 35%, máximo 3
  usos y cooldown de 3 turnos. Para pruebas es posible forzar éxito/resultado con
  `forceSuccess` y `forceOutcome`.

## Flujo sugerido con Postman / HTTP

1. Crear dos usuarios (`/usuarios`).
2. Crear una sala (`/salas`).
3. Agregar jugadores a la sala (`/salas/{id}/participantes`).
4. Iniciar la partida (`/salas/{id}/partidas`).
5. Desplegar campamentos (`/partidas/{id}/despliegue`).
6. Ejecutar turnos (`/partidas/{id}/turnos`) alternando jugadores.
7. Consultar el estado general (`/partidas/{id}`) para sincronizar la interfaz.

El archivo [`docs/jugadas-ejemplo.json`](docs/jugadas-ejemplo.json) contiene una
colección ordenada con los requests mínimos para reproducir el flujo completo.

## Modelo de datos

La descripción visual del modelo actualizado (incluyendo `SalaParticipante` y
los nuevos campos de Partida/Jugador/Campamento/Turno) está disponible en
[`docs/modelo-ER.md`](docs/modelo-ER.md).

## Validaciones y manejo de errores

- Todos los controladores devuelven códigos HTTP acordes (`400` validaciones,
  `404` recursos inexistentes, `409` conflictos, `500` errores inesperados).
- Se valida formato de email, longitud mínima de contraseña, números no
  negativos y coordenadas dentro del tablero.
- El motor de partida rechaza disparos fuera de la mitad rival, campamentos
  duplicados, reubicaciones inválidas y acciones fuera de turno.

## Scripts útiles

| Script | Comando |
| --- | --- |
| Ejecutar servidor | `npm start` |
| Modo desarrollo | `npm run dev` |
| Migraciones | `npx sequelize-cli db:migrate` |
| Revertir última migración | `npx sequelize-cli db:migrate:undo` |

## Notas adicionales

- Para pruebas automatizadas se pueden usar los parámetros `forceSuccess` y
  `forceOutcome` del endpoint `/partidas/{id}/suministro` y `autoPasar` del
  endpoint `/partidas/{id}/turnos`.
- El archivo `.sequelizerc` dirige a Sequelize CLI a los directorios dentro de
  `src/`, por lo que los comandos (`db:migrate`, `db:seed`, etc.) deben
  ejecutarse desde la raíz del repositorio.
- La configuración admite el uso de `DATABASE_URL` (Render u otros PaaS). Si no
  está definida, se utilizan las variables individuales `DB_USERNAME`,
  `DB_PASSWORD`, `DB_HOST`, `DB_PORT` y `DB_DATABASE`.
- El servidor expone el estado completo del tablero únicamente al cliente
  autenticado; la interfaz es responsable de ocultar información sensible al
  rival.
