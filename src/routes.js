const Router = require('koa-router');
const perfilController = require('./controllers/perfilController');
const usuarioController = require('./controllers/usuarioController');
const jugadorController =require('./controllers/jugadorController');

const router = new Router();

// Ruta: GET /perfil/:id
router.get('/perfil/:id', perfilController.getPerfilById);
router.get('/usuarios', usuarioController.getAllUsuarios);
router.get('/usuarios/:id', usuarioController.getUsuarioById);
router.post('/usuarios', usuarioController.createUsuario);
router.put('/usuarios/:id', usuarioController.updateUsuario);
router.delete('/usuarios/:id', usuarioController.deleteUsuario);

module.exports = router;
