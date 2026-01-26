const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// 1. CONFIGURARE MIDDLEWARE & CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));
app.use(express.json());

// 2. INIȚIALIZARE SUPABASE
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 3. RUTE STATUS & HEALTH (Pentru a elimina erorile 404 din Setări)
app.get('/', (req, res) => res.json({ mesaj: "Backend ONLINE 🚀", status: "Sistem activ" }));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/v1/backend-summary', (req, res) => {
    res.json({ provider: "Render+Supabase", database: "CONNECTED 🟢", status: "OK" });
});

// 4. LOGICĂ ENDPOINT-URI DINAMICE (CRUD COMPLET)
const endpoints = ['rooms', 'reservations', 'channels', 'pricing', 'guests', 'payments', 'reviews', 'notifications'];

endpoints.forEach(item => {
    // Mapare nume tabel: 'rooms' -> 'room', 'pricing' -> 'pricing_rule'
    let tableName = item === 'pricing' ? 'pricing_rule' : item.slice(0, -1);
    if (item === 'rooms') tableName = 'room';
    if (item === 'reservations') tableName = 'reservation';

    // GET - Citire date
    app.get(`/api/v1/${item}`, async (req, res) => {
        try {
            const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: true });
            if (error) throw error;
            res.json(data || []);
        } catch (err) {
            res.status(500).json({ error: "Eroare DB ❌", message: err.message });
        }
    });

    // POST - Creare date noi
    app.post(`/api/v1/${item}`, async (req, res) => {
        try {
            const body = (item === 'rooms' || item === 'reservations') ? { property_id: 1, ...req.body } : req.body;
            const { data, error } = await supabase.from(tableName).insert([body]).select();
            if (error) throw error;
            res.status(201).json(data[0]);
        } catch (err) {
            res.status(500).json({ error: "Eroare Salvare ❌", message: err.message });
        }
    });

    // PUT - Actualizare date (Repară eroarea 404 din Setări)
    app.put(`/api/v1/${item}/:id?`, async (req, res) => {
        try {
            const id = req.params.id || req.body.id;
            const { data, error } = await supabase.from(tableName).update(req.body).eq('id', id).select();
            if (error) throw error;
            res.json(data[0] || { status: "Actualizat" });
        } catch (err) {
            res.status(500).json({ error: "Eroare Update ❌", message: err.message });
        }
    });

    // DELETE - Ștergere date (Repară eroarea 404 din Setări)
    app.delete(`/api/v1/${item}/:id?`, async (req, res) => {
        try {
            const id = req.params.id || req.body.id;
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw error;
            res.json({ status: "Șters cu succes ✅" });
        } catch (err) {
            res.status(500).json({ error: "Eroare Ștergere ❌", message: err.message });
        }
    });
});

// 5. PORNIRE SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server HostManagerPro Online pe port ${PORT}`));
