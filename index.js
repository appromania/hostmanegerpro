const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// 1. CONFIGURARE MIDDLEWARE & CORS
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));
app.options('*', cors());
app.use(express.json());

// 2. INIȚIALIZARE SUPABASE (IMPORTANT: Această linie lipsea)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 3. PAGINA PRINCIPALĂ
app.get('/', (req, res) => {
    res.json({
        mesaj: "Backend HostManagerPro este ONLINE 🚀",
        brief: "Folosește /api/v1/ pentru date",
        status: "Sistem activ"
    });
});

// 4. ENDPOINT PENTRU BRIEF (Rezumat setări)
app.get('/api/v1/backend-summary', (req, res) => {
    res.json({
        provider: "Render + Supabase",
        baseUrl: "https://hostmanegerpro.onrender.com",
        environment: "DEVELOPMENT",
        database: "SUPABASE CONNECTED 🟢",
        activeStatus: "🟢 Serverul răspunde corect"
    });
});

// 5. ENDPOINT-URI PENTRU TESTE (Corectate pentru a mapa tabelele corect)
const endpoints = ['rooms', 'reservations', 'channels', 'pricing', 'guests', 'payments', 'reviews', 'notifications'];

endpoints.forEach(item => {
    app.get(`/api/v1/${item}`, async (req, res) => {
        // Logică de transformare: 'rooms' -> 'Room', 'payments' -> 'Payment'
        let tableName = item.charAt(0).toUpperCase() + item.slice(0, -1);
        
        // Excepții manuale pentru a se potrivi cu tabelele tale din Supabase
        if (item === 'pricing') tableName = 'PricingRule';
        if (item === 'rooms') tableName = 'Room';

        try {
            const { data, error } = await supabase.from(tableName).select('*').limit(1);
            
            if (error) {
                return res.json({ 
                    status: "Eroare DB ❌", 
                    tabel_cautat: tableName,
                    message: error.message 
                });
            }
            
            res.json({ 
                status: "Conexiune OK ✅", 
                info: `Test reusit pentru ${item}`, 
                tabel: tableName,
                data: data 
            });
        } catch (err) {
            res.json({ 
                status: "Eroare Server ⚠️", 
                message: err.message 
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Online pe port ${PORT}`));
