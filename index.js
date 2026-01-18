require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Conectare la baza de date pe care o ai deja
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Status Check pentru aplicație
app.get('/api/v1/status', (req, res) => {
    res.json({ status: 'online', database: 'connected' });
});

// Endpoint pentru Rooms
app.get('/api/v1/rooms', async (req, res) => {
    const { data, error } = await supabase.from('Room').select('*');
    if (error) return res.status(400).json(error);
    res.json(data);
});

// Endpoint pentru Reservations
app.get('/api/v1/reservations', async (req, res) => {
    const { data, error } = await supabase.from('Reservation').select('*');
    if (error) return res.status(400).json(error);
    res.json(data);
});

// Repetă structura de mai sus pentru restul entităților (Pricing, Guests, etc.)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server activ pe portul ${PORT}`));
