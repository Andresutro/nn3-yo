const Router = require('koa-router');
const perfilController = require('./controllers/perfilController');
const usuarioController = require('./controllers/usuarioController');
const jugadorController = require('./controllers/jugadorController');
const salaController = require('./controllers/salaController');
const partidaController = require('./controllers/partidaController');

const router = new Router();

router.get('/perfil/:id', perfilController.getPerfilById);

router.get('/usuarios', usuarioController.getAllUsuarios);
router.get('/usuarios/:id', usuarioController.getUsuarioById);
router.post('/usuarios', usuarioController.createUsuario);
router.put('/usuarios/:id', usuarioController.updateUsuario);
router.delete('/usuarios/:id', usuarioController.deleteUsuario);

router.get('/jugadores', jugadorController.getAllJugadores);
router.get('/jugadores/:id', jugadorController.getJugadorById);
router.post('/jugadores', jugadorController.createJugador);
router.put('/jugadores/:id', jugadorController.updateJugador);
router.delete('/jugadores/:id', jugadorController.deleteJugador);

router.get('/salas', salaController.getAllSalas);
router.get('/salas/id/:id', salaController.getSalaById);
router.get('/salas/codigo/:codigo', salaController.getSalaByCodigo);
router.post('/salas', salaController.createSala);
router.put('/salas/:id', salaController.updateSala);
router.delete('/salas/:id', salaController.deleteSala);
router.get('/salas/:id/participantes', salaController.listarParticipantes);
router.post('/salas/:id/participantes', salaController.unirseASala);
router.delete('/salas/:id/participantes/:participanteId', salaController.abandonarSala);

router.post('/salas/:salaId/partidas', partidaController.createFromSala);
router.get('/partidas/:id', partidaController.getEstado);
router.post('/partidas/:partidaId/despliegue', partidaController.desplegarCampamento);
router.post('/partidas/:partidaId/turnos', partidaController.ejecutarTurno);
router.post('/partidas/:partidaId/suministro', partidaController.solicitarSuministro);

module.exports = router;
