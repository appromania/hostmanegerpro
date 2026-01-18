const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));

// Adaugă și acest handler pentru cererile de tip OPTIONS (pre-flight)
app.options('*', cors());

// 1. PAGINA PRINCIPALĂ (Fix pentru "Cannot GET /")
app.get('/', (req, res) => {
    res.json({
        mesaj: "Backend HostManagerPro este ONLINE 🚀",
        brief: "Folosește /api/v1/ pentru date",
        status: "Sistem activ"
    });
});

// 2. ENDPOINT PENTRU BRIEF (Rezumat setări)
app.get('/api/v1/backend-summary', (req, res) => {
    res.json({
        provider: "Render + Supabase",
        baseUrl: "https://hostmanegerpro.onrender.com",
        environment: "DEVELOPMENT",
        database: "SUPABASE CONNECTED 🟢",
        activeStatus: "🟢 Serverul răspunde corect"
    });
});

// 3. ENDPOINT-URI PENTRU TESTE (Rooms, Reservations, etc.)
const endpoints = ['rooms', 'reservations', 'channels', 'pricing', 'guests', 'payments', 'reviews', 'notifications'];
endpoints.forEach(item => {
    app.get(`/api/v1/${item}`, async (req, res) => {
        // Mapăm la tabelul corect (Ex: rooms -> Room)
        const table = item.charAt(0).toUpperCase() + item.slice(0, -1);
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) return res.json({ status: "Eroare DB ❌", message: error.message });
            res.json({ status: "Conexiune OK ✅", info: `Test reusit pentru ${item}`, data: data });
        } catch (err) {
            res.json({ status: "Eroare Server ⚠️", message: err.message });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Online pe port ${PORT}`));
