const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, 'tickets.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
// Bootstrap local (instalado con npm)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// ---------- Persistencia (tickets.json) ----------
function leerTickets() {
  try {
    const data = fs.readFileSync(DB, 'utf8');
    const json = JSON.parse(data || '[]');
    return Array.isArray(json) ? json : [];
  } catch (e) {
    return []; // archivo inexistente, vacío o corrupto
  }
}
function guardarTickets(tickets) {
  fs.writeFileSync(DB, JSON.stringify(tickets, null, 2), 'utf8');
}
if (!fs.existsSync(DB)) guardarTickets([]);

// ---------- Rutas ----------
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Inicio', activa: 'inicio' });
});

app.get('/reportar', (req, res) => {
  res.render('reportar', {
    titulo: 'Reportar Falla',
    activa: 'reportar',
    exito: req.query.ok === '1',
    error: req.query.error === '1'
  });
});

app.post('/reportar', (req, res) => {
  const { solicitante, ubicacion, descripcion } = req.body;
  if (!solicitante?.trim() || !ubicacion?.trim() || !descripcion?.trim()) {
    return res.redirect('/reportar?error=1');
  }
  const mensajes = leerTickets();
  mensajes.push({
    id: Date.now(),
    solicitante: solicitante.trim(),
    ubicacion: ubicacion.trim(),
    descripcion: descripcion.trim(),
    fecha: new Date().toLocaleString('es-CO')
  });
  guardarTickets(mensajes);
  res.redirect('/reportar?ok=1');
});

app.get('/panel', (req, res) => {
  const mensajes = leerTickets();
  res.render('panel', { titulo: 'Panel de Tickets', activa: 'panel', mensajes });
});

app.post('/panel/resolver', (req, res) => {
  const id = Number(req.body.id);
  const restantes = leerTickets().filter(t => t.id !== id);
  guardarTickets(restantes);
  res.redirect('/panel');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HelpDesk corriendo en http://localhost:${PORT}`);
});
