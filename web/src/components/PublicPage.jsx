import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export function PublicPage({ eyebrow, title, description, children }) {
  return (
    <main className="flex min-h-screen flex-col bg-busway-light">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-5 py-12">
        <div className="mx-auto max-w-6xl">
          {eyebrow && <p className="text-sm font-extrabold uppercase tracking-wide text-busway-blue">{eyebrow}</p>}
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight text-navy md:text-5xl">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>}
        </div>
      </section>
      <section className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </section>
      <Footer />
    </main>
  );
}

export function InfoCard({ title, children, accent = false }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className={['text-base font-extrabold', accent ? 'text-busway-blue' : 'text-navy'].join(' ')}>
        {title}
      </h2>
      <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
    </article>
  );
}