'use strict';
module.exports = (sequelize, DataTypes) => {
    var Logs = sequelize.define('Logs', {
        id: {
            allowNull: false,
            primaryKey: true,
            unique: true,
            type: DataTypes.UUID,
        },
        zipcode: {
            type: DataTypes.STRING,
            allowNull: false
        },
        temp: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        feels_like: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        temp_min: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        temp_max: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        pressure: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        humidity: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        weather_created: {
            allowNull: false,
            type: DataTypes.STRING
        }
    }, {
        timestamps: false,
        freezeTableName: true,
        modelName: 'singularName'
    }
    );



    return Logs;
}
