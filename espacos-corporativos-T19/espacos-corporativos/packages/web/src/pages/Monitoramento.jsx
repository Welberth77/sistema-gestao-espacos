import { PageHeader, Placeholder } from '../components/ui.jsx';

export default function Monitoramento() {
  return (
    <>
      <PageHeader title="Monitoramento do Motor" subtitle="Saúde do mecanismo de recomendação em produção." />
      <Placeholder tarefa="T-32">Tempo, execuções, ocupação média, conflitos e intervenções.</Placeholder>
    </>
  );
}
