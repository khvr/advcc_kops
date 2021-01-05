'use strict';
module.exports = (sequelize, DataTypes) => {
    var Watch = sequelize.define('Watch', {
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
        watch_created: {
            allowNull: false,
            unique: true,
            type: DataTypes.STRING
        },
        watch_updated: {
            allowNull: false,
            unique: true,
            type: DataTypes.STRING
        }
    }, {
        timestamps: false,
        freezeTableName: true,
        modelName: 'singularName'
    }
    );

    Watch.associate = function (models) {
        // associations can be defined here
        Watch.hasMany(models.Alert, {
            onDelete: "cascade",
            foreignKey: "watch_id",
        });
    };

    return Watch;
}
