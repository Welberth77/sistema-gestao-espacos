// App.jsx — define as rotas dentro do layout.
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Salas from './pages/Salas.jsx';
import SetoresEquipes from './pages/SetoresEquipes.jsx';
import Restricoes from './pages/Restricoes.jsx';
import Alocacao from './pages/Alocacao.jsx';
import Comparacao from './pages/Comparacao.jsx';
import Governanca from './pages/Governanca.jsx';
import Monitoramento from './pages/Monitoramento.jsx';
import Testes from './pages/Testes.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/salas" element={<Salas />} />
        <Route path="/setores" element={<SetoresEquipes />} />
        <Route path="/restricoes" element={<Restricoes />} />
        <Route path="/alocacao" element={<Alocacao />} />
        <Route path="/comparacao" element={<Comparacao />} />
        <Route path="/governanca" element={<Governanca />} />
        <Route path="/monitoramento" element={<Monitoramento />} />
        <Route path="/testes" element={<Testes />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
