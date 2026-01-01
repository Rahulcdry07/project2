/**
 * DSR Item Model
 * Represents Detailed Schedule of Rates items for cost estimation
 */

const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DSRItem = sequelize.define(
    'DSRItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: true,
          isIn: [
            [
              'sqm',
              'cum',
              'rmt',
              'kg',
              'nos',
              'sqft',
              'cft',
              'ton',
              'ltr',
              'bag',
              'set',
              'each',
              'pair',
              'dozen',
            ],
          ],
        },
      },
      rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      sub_category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      material_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      labor_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      equipment_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      overhead_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'DSRItems',
      timestamps: true,
      indexes: [{ fields: ['item_code'] }, { fields: ['category'] }, { fields: ['is_active'] }],
    }
  );

  return DSRItem;
};
