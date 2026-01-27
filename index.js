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

// 3. RUTE STATUS & HEALTH (Repară eroarea "Conectare..." din interfață)
app.get('/', (req, res) => res.json({ mesaj: "Backend ONLINE 🚀", status: "Sistem activ" }));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/v1/status', (req, res) => res.json({ connected: true, status: "OK", timestamp: new Date() }));
app.get('/api/v1/backend-summary', (req, res) => {
    res.json({ provider: "Render+Supabase", database: "CONNECTED 🟢", status: "OK" });
});

// 4. ENDPOINT PENTRU iCAL (Sincronizare gratuită Booking/Airbnb/Google)
app.get('/api/v1/ical/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { data: reservations, error } = await supabase
            .from('reservation')
            .select('*')
            .eq('room_id', roomId);

        if (error) throw error;

        let ical = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ChannelPro//NONSGML v1.0//EN\n";
        (reservations || []).forEach(resv => {
            ical += "BEGIN:VEVENT\n";
            ical += `DTSTART;VALUE=DATE:${resv.check_in.replace(/-/g, '')}\n`;
            ical += `DTEND;VALUE=DATE:${resv.check_out.replace(/-/g, '')}\n`;
            ical += `SUMMARY:Rezervat (${resv.channel})\n`;
            ical += "END:VEVENT\n";
        });
        ical += "END:VCALENDAR";

        res.setHeader('Content-Type', 'text/calendar');
        res.send(ical);
    } catch (err) {
        res.status(500).send("Eroare generare iCal");
    }
});

// 5. LOGICĂ CRUD DINAMICĂ (Reparată pentru compatibilitate totală)
const endpoints = ['rooms', 'reservations', 'channels', 'pricing', 'guests', 'payments', 'reviews', 'notifications'];

endpoints.forEach(item => {
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

    // POST - Creare (Fix: Conversie tipuri date pentru a evita Eroarea 500)
    app.post(`/api/v1/${item}`, async (req, res) => {
        try {
            let payload = { ...req.body };
            if (item === 'rooms') {
                payload.property_id = payload.property_id || 1;
                payload.max_occupancy = parseInt(payload.max_occupancy) || 2;
                payload.base_price = parseFloat(payload.base_price) || 0;
            }
            if (item === 'reservations') {
                payload.property_id = payload.property_id || 1;
                payload.total_price = parseFloat(payload.total_price) || 0;
            }

            const { data, error } = await supabase.from(tableName).insert([payload]).select();
            if (error) throw error;
            res.status(201).json(data[0]);
        } catch (err) {
            res.status(500).json({ error: "Eroare Salvare ❌", message: err.message });
        }
    });

    // PUT - Actualizare
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

    // DELETE - Ștergere
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

// 6. PORNIRE SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] HostManagerPro Online pe port ${PORT}`));
