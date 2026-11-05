// Sistema do Léo · Gestão de Tráfego Pago (Hera Digital)
const meta = require('./meta');
require('../_base/servidor')({ id: 'trafego', nome: 'Tráfego Pago · Léo', porta: 4412, pasta: __dirname, api: meta.rota });
