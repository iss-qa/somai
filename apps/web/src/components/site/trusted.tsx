const logos = [
  'Padaria Bella',
  'Studio Atena',
  'Barbearia Norte',
  'Pet Amigo',
  'Clínica Mais',
  'Sushi do Kenji',
  'Fit Hub',
  'Açaí Tropical',
]

export function Trusted() {
  return (
    <section aria-label="Clientes" className="relative py-10 md:py-14">
      <div className="container">
        <div className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
          Mais de 1.200 pequenas empresas automatizam o marketing com a Soma.AI
        </div>
        <div className="mt-6 mask-fade-x overflow-hidden">
          <div className="flex w-max animate-marquee gap-10 pr-10">
            {[...logos, ...logos, ...logos].map((l, i) => (
              <div
                key={`${l}-${i}`}
                className="flex shrink-0 items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 text-[10px] font-bold text-zinc-300">
                  {l
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <span className="font-display text-sm">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
