/**
 * User model
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

/**
 * Define the User model
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} - User model
 */
module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: 'Username cannot be empty'
                },
                len: {
                    args: [3, 50],
                    msg: 'Username must be between 3 and 50 characters'
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Please enter a valid email address'
                },
                notEmpty: {
                    msg: 'Email cannot be empty'
                }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Password cannot be empty'
                },
                len: {
                    args: [6, 100],
                    msg: 'Password must be at least 6 characters long'
                }
            }
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'user',
            validate: {
                isIn: {
                    args: [['user', 'admin']],
                    msg: 'Role must be either "user" or "admin"'
                }
            }
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verification_token: {
            type: DataTypes.STRING,
        },
        reset_token: {
            type: DataTypes.STRING,
        },
        reset_token_expires_at: {
            type: DataTypes.DATE,
        },
        remember_token: {
            type: DataTypes.STRING,
        },
        refresh_token: {
            type: DataTypes.TEXT,
        },
        refresh_token_expires_at: {
            type: DataTypes.DATE,
        },
        profile_picture: {
            type: DataTypes.STRING,
        },
        bio: {
            type: DataTypes.TEXT(500),
            validate: {
                len: {
                    args: [0, 500],
                    msg: 'Bio must be less than 500 characters'
                }
            }
        },
        location: {
            type: DataTypes.STRING(100),
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Location must be less than 100 characters'
                }
            }
        },
        website: {
            type: DataTypes.STRING,
            validate: {
                isUrl: {
                    msg: 'Please provide a valid website URL'
                }
            }
        },
        github_url: {
            type: DataTypes.STRING,
            validate: {
                isUrl: {
                    msg: 'Please provide a valid GitHub URL'
                }
            }
        },
        linkedin_url: {
            type: DataTypes.STRING,
            validate: {
                isUrl: {
                    msg: 'Please provide a valid LinkedIn URL'
                }
            }
        },
        twitter_url: {
            type: DataTypes.STRING,
            validate: {
                isUrl: {
                    msg: 'Please provide a valid Twitter URL'
                }
            }
        },
    });

    // Add a method to the User model to compare passwords
    User.prototype.comparePassword = async function (password) {
        return bcrypt.compare(password, this.password);
    };

    // Error handling hooks
    User.addHook('beforeCreate', async (user, _options) => {
        try {
            // Add any additional validations or data transformations here
            if (user.email) {
                user.email = user.email.toLowerCase(); // Normalize email
            }
        } catch (error) {
            throw new Error(`Error in beforeCreate hook: ${error.message}`);
        }
    });

    User.addHook('beforeUpdate', async (user, _options) => {
        try {
            // Add any additional validations or data transformations here
            if (user.changed('email')) {
                user.email = user.email.toLowerCase(); // Normalize email
            }
        } catch (error) {
            throw new Error(`Error in beforeUpdate hook: ${error.message}`);
        }
    });

    return User;
};