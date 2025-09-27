/**
 * FileVector model for PDF processing and vector embeddings
 */
const { DataTypes } = require('sequelize');

/**
 * Define the FileVector model
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} - FileVector model
 */
module.exports = (sequelize) => {
    const FileVector = sequelize.define('FileVector', {
        filename: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Filename cannot be empty'
                }
            }
        },
        original_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Original filename cannot be empty'
                }
            }
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'File path cannot be empty'
                }
            }
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'File size must be greater than 0'
                }
            }
        },
        mime_type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'MIME type cannot be empty'
                }
            }
        },
        content_text: {
            type: DataTypes.TEXT,
        },
        page_count: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        embedding_vector: {
            type: DataTypes.TEXT, // JSON string of vector array
        },
        embedding_model: {
            type: DataTypes.STRING,
            defaultValue: 'sentence-transformers/all-MiniLM-L6-v2',
        },
        processed_at: {
            type: DataTypes.DATE,
        },
        processing_status: {
            type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
            defaultValue: 'pending',
        },
        error_message: {
            type: DataTypes.TEXT,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    });

    // Define associations
    FileVector.associate = function(models) {
        FileVector.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    // Instance methods
    FileVector.prototype.getEmbeddingVector = function() {
        if (this.embedding_vector) {
            try {
                return JSON.parse(this.embedding_vector);
            } catch (error) {
                console.error('Error parsing embedding vector:', error);
                return null;
            }
        }
        return null;
    };

    FileVector.prototype.setEmbeddingVector = function(vector) {
        if (Array.isArray(vector)) {
            this.embedding_vector = JSON.stringify(vector);
        } else {
            throw new Error('Embedding vector must be an array');
        }
    };

    // Class methods
    FileVector.findSimilar = async function(queryVector, limit = 10, userId = null) {
        // Simple cosine similarity search
        // In production, you might want to use a vector database like Pinecone, Weaviate, or PostgreSQL with pgvector
        const whereClause = userId ? { user_id: userId } : {};
        const files = await this.findAll({
            where: {
                ...whereClause,
                processing_status: 'completed',
                embedding_vector: { [sequelize.Op.ne]: null }
            }
        });

        const similarities = files.map(file => {
            const vector = file.getEmbeddingVector();
            if (!vector) return { file, similarity: 0 };
            
            const similarity = cosineSimilarity(queryVector, vector);
            return { file, similarity };
        });

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    };

    return FileVector;
};

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
}