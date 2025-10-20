'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.Perfil, {
        foreignKey: 'id_usuario',
        as: 'perfil',
      });
      this.hasMany(models.Jugador, {
        foreignKey: 'id_usuario'
      });
    }
  }
  Usuario.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Usuario',
  });
  return Usuario; 
};