import dotenv from 'dotenv';
dotenv.config();

const apiConfig = {
    gnews: {
        baseUrl: 'https://gnews.io/api/v4/top-headlines',
        apiKey: process.env.GNEWS_API_KEY, 
        defaultParams: {
            lang: 'es',
            country: 'ar',
            max: 0
        }
    }
};

export default apiConfig;
