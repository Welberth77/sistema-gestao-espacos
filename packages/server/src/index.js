// index.js — servidor Express da API.
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import recursos from './routes/recursos.js';
import alocacoes from './routes/alocacoes.js';
import paineis from './routes/paineis.js';
import { tabelasExistem, reset } from './seed.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, servico: 'espacos-api' }));

app.use('/api', recursos);
app.use('/api/alocacoes', alocacoes);
app.use('/api', paineis);

// Middleware de erro: sempre responde JSON legível.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: err.message || 'Erro interno' });
});

const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    // Em dev, semeia o banco automaticamente se ainda não houver tabelas.
    const existe = await tabelasExistem();
    if (!existe || process.env.SEED_ON_START === 'true') {
      console.log('Inicializando banco (schema + seed)...');
      await reset();
    }
  } catch (e) {
    console.error('Aviso: não foi possível inicializar o banco automaticamente.', e.message);
  }
  app.listen(PORT, () => console.log(`API ouvindo em http://localhost:${PORT}`));
}

iniciar();

export default app;
