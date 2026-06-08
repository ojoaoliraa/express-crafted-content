import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <article className="prose prose-neutral max-w-none">
          <h1 className="text-4xl font-semibold mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Versão preliminar — em conformidade com a LGPD (Lei nº 13.709/2018).
            <br />
            Última atualização: 8 de junho de 2026. Este texto será revisado
            por advogado antes do lançamento.
          </p>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">1. Quem somos</h2>
            <p>
              CAIC (Creative AI for Creators) é o controlador dos seus dados
              pessoais nos termos da LGPD. Para qualquer dúvida sobre
              privacidade, fale com nosso encarregado (DPO) pelo email{" "}
              <a href="mailto:privacidade@caic.app" className="underline">
                privacidade@caic.app
              </a>
              .
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">2. Dados que coletamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Cadastro:</strong> email, nome, senha (armazenada
                com hash) e/ou identificador de login social (Google).
              </li>
              <li>
                <strong>Onboarding:</strong> respostas sobre posicionamento,
                público-alvo, tom de voz, estilo visual e notas adicionais.
              </li>
              <li>
                <strong>Conteúdo gerado:</strong> ideias, copy, formatos
                escolhidos e carrosséis salvos.
              </li>
              <li>
                <strong>Imagens:</strong> uploads que você fizer ficam
                armazenados no seu espaço privado dentro do nosso storage.
              </li>
              <li>
                <strong>Pagamentos:</strong> processados pelo Stripe.
                Recebemos apenas metadados (ID da transação, valor, status).
                Dados de cartão são tratados diretamente pelo Stripe e
                <em> não</em> chegam aos nossos servidores.
              </li>
              <li>
                <strong>Uso:</strong> logs técnicos, IP, tipo de
                dispositivo e ações relevantes no app (para segurança e
                depuração).
              </li>
            </ul>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">3. Para que usamos seus dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Operar o serviço e personalizar as sugestões do CAIC.</li>
              <li>Cobrar e gerenciar créditos.</li>
              <li>Atender suporte e cumprir obrigações legais.</li>
              <li>
                <strong>Melhorar nossos modelos com dados anonimizados —
                somente se você optar (opt-in).</strong> Esse uso é
                desativado por padrão e pode ser revertido a qualquer
                momento nas configurações da conta.
              </li>
            </ul>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">4. Compartilhamento com terceiros</h2>
            <p>
              Compartilhamos dados apenas com operadores estritamente
              necessários para entregar o serviço:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Anthropic</strong> — geração de copy (Claude).
              </li>
              <li>
                <strong>Replicate</strong> — geração/edição de imagens
                (quando aplicável).
              </li>
              <li>
                <strong>Supabase</strong> — banco de dados, autenticação e
                storage.
              </li>
              <li>
                <strong>Stripe</strong> — processamento de pagamentos.
              </li>
            </ul>
            <p>
              Não vendemos seus dados pessoais. Não compartilhamos com
              terceiros para fins de marketing externo.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">5. Métricas do Instagram (opt-in)</h2>
            <p>
              Se você optar por conectar sua conta Instagram Business através
              da API oficial da Meta, podemos coletar métricas dos posts que
              você publicar via CAIC (impressões, alcance, engajamento) para
              melhorar futuras gerações.
            </p>
            <p>
              Esse acesso é <strong>sempre opt-in</strong>, controlado por
              você, revogável a qualquer momento, e usa exclusivamente a API
              oficial da Meta. <strong>Nunca fazemos scraping</strong> de
              dados do Instagram nem coletamos métricas sem autorização
              explícita.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">6. Seus direitos (LGPD)</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar a existência e acessar seus dados.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar anonimização ou eliminação.</li>
              <li>Solicitar portabilidade para outro serviço.</li>
              <li>Revogar consentimentos (incluindo opt-in de modelo).</li>
              <li>Apresentar reclamação à ANPD.</li>
            </ul>
            <p>
              <strong>Exclusão da conta:</strong> ao deletar sua conta nas
              configurações, removemos seu perfil, onboarding, carrosséis,
              uploads e histórico de créditos em até 30 dias. Dados que
              precisamos reter por obrigação legal (ex.: registros fiscais)
              são mantidos pelo prazo mínimo exigido por lei.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">7. Retenção</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após
              exclusão, dados pessoais são apagados em até 30 dias, exceto
              quando houver base legal para retenção (cumprimento de
              obrigação fiscal, defesa em processo, etc.).
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">8. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais razoáveis para
              proteger seus dados: criptografia em trânsito (TLS),
              armazenamento com controle de acesso (RLS), senhas com hash e
              segregação de ambientes.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">9. Transferência internacional</h2>
            <p>
              Alguns dos nossos operadores (Anthropic, Stripe, Supabase)
              processam dados fora do Brasil. Em todos os casos, exigimos
              padrões de segurança e privacidade compatíveis com a LGPD.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">10. Alterações</h2>
            <p>
              Podemos atualizar esta política. Mudanças relevantes serão
              comunicadas por email ou aviso no app.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">11. Contato</h2>
            <p>
              Encarregado de Dados (DPO):{" "}
              <a href="mailto:privacidade@caic.app" className="underline">
                privacidade@caic.app
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
