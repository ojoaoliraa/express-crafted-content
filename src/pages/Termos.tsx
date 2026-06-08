import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Termos() {
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
          <h1 className="text-4xl font-semibold mb-2">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Versão preliminar — última atualização: 8 de junho de 2026.
            <br />
            Este texto será revisado por advogado antes do lançamento.
          </p>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">1. O que o CAIC faz</h2>
            <p>
              O CAIC (Creative AI for Creators) é uma ferramenta de assistência
              criativa que ajuda você a gerar carrosséis de Instagram a partir
              de ideias, copy e imagens. Ele combina mecânicas de copywriting
              testadas com modelos de inteligência artificial para entregar
              rascunhos editáveis.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">2. O que o CAIC não faz</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Não publica nada no seu Instagram sem sua ação explícita.</li>
              <li>Não garante alcance, engajamento ou resultado comercial.</li>
              <li>Não substitui revisão humana antes da publicação.</li>
              <li>Não fornece aconselhamento jurídico, médico ou financeiro.</li>
            </ul>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">3. Direitos sobre o conteúdo</h2>
            <p>
              Todo carrossel gerado por você usando o CAIC é seu. Você detém
              os direitos de uso, publicação, modificação e exploração
              comercial do conteúdo gerado.
            </p>
            <p>
              O CAIC não reivindica propriedade sobre seus carrosséis. Você é o
              responsável final pelo conteúdo publicado, incluindo direitos de
              imagem das fotos utilizadas (próprias, do banco de imagens ou de
              terceiros).
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">4. Conta e responsabilidade do usuário</h2>
            <p>
              Você é responsável por manter seguras as credenciais da sua
              conta e por todo conteúdo gerado a partir dela. Não é permitido
              usar o CAIC para criar conteúdo ilegal, difamatório,
              discriminatório, ou que viole direitos de terceiros.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">5. Limitação de responsabilidade</h2>
            <p>
              O CAIC é fornecido "no estado em que se encontra". Na máxima
              extensão permitida por lei, não nos responsabilizamos por
              perdas indiretas, lucros cessantes, dano à imagem ou prejuízos
              decorrentes do uso ou impossibilidade de uso do serviço.
            </p>
            <p>
              Nossa responsabilidade total, em qualquer hipótese, fica
              limitada ao valor efetivamente pago por você ao CAIC nos 12
              meses anteriores ao evento que originou a reclamação.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">6. Pagamentos, cancelamento e reembolso</h2>
            <p>
              Os créditos comprados podem ser usados a qualquer momento,
              respeitando a validade indicada no momento da compra.
            </p>
            <p>
              <strong>Reembolso:</strong> créditos <em>não consumidos</em>{" "}
              podem ser reembolsados em até <strong>7 dias corridos</strong>{" "}
              após a compra, mediante solicitação pelo email de suporte.
              Créditos já utilizados em gerações não são reembolsáveis.
            </p>
            <p>
              Você pode cancelar sua conta a qualquer momento. O cancelamento
              não gera reembolso automático de créditos já consumidos.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">7. Alterações nos termos</h2>
            <p>
              Podemos atualizar estes termos. Mudanças relevantes serão
              comunicadas por email ou aviso no app com antecedência razoável.
              O uso continuado após a atualização representa aceite das
              novas condições.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">8. Lei aplicável e foro</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do
              Brasil. Fica eleito o foro da Comarca de São Paulo/SP como
              competente para dirimir quaisquer controvérsias, com renúncia
              expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-3 mb-8">
            <h2 className="text-2xl font-semibold">9. Contato</h2>
            <p>
              Dúvidas, solicitações de reembolso ou exclusão de conta:{" "}
              <a href="mailto:contato@caic.app" className="underline">
                contato@caic.app
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
