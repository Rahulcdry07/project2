// Token management utility
class TokenManager {
    static getAccessToken() {
        return localStorage.getItem('token');
    }

    static getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    static setTokens(accessToken, refreshToken) {
        localStorage.setItem('token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    static clearTokens() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }

    static async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            const result = await response.json();

            if (response.ok) {
                this.setTokens(result.token, refreshToken);
                return result.token;
            } else {
                // Refresh token is invalid, clear all tokens
                this.clearTokens();
                throw new Error(result.error || 'Failed to refresh token');
            }
        } catch (error) {
            this.clearTokens();
            throw error;
        }
    }

    static async makeAuthenticatedRequest(url, options = {}) {
        let accessToken = this.getAccessToken();
        
        if (!accessToken) {
            throw new Error('No access token available');
        }

        // Add authorization header
        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`,
            },
        };

        try {
            const response = await fetch(url, authOptions);
            
            // If token is expired, try to refresh
            if (response.status === 401) {
                try {
                    const newToken = await this.refreshAccessToken();
                    // Retry the request with new token
                    authOptions.headers['Authorization'] = `Bearer ${newToken}`;
                    return await fetch(url, authOptions);
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    window.location.href = '/login';
                    throw refreshError;
                }
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }
}

export default TokenManager; 