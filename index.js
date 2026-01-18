const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'] })); // Deblochează butoanele din base44
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Endpoint pentru Rezumatul de care ai nevoie (Brief)
app.get('/api/v1/backend-summary', (req, res) => {
    res.json({
        provider: "Firebase/Render",
        base_url: "https://hostmanegerpro.onrender.com",
        status: "ACTIVE 🟢",
        database: "SUPABASE CONNECTED 🟢",
        environment: "DEV"
    });
});

// Endpoint-uri pentru Teste
const endpoints = ['rooms', 'reservations', 'channels', 'pricing', 'guests', 'payments', 'reviews', 'notifications'];
endpoints.forEach(item => {
    app.get(`/api/v1/${item}`, async (req, res) => {
        // Mapăm la tabelul corect (Ex: rooms -> Room)
        const table = item.charAt(0).toUpperCase() + item.slice(0, -1);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) return res.json({ status: "Eroare DB ❌", message: error.message });
        res.json({ status: "Conexiune OK ✅", info: `Test reusit pentru ${item}`, data: data });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Online pe port ${PORT}`));
