import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { FiCreditCard, FiTruck, FiUser, FiUsers } from 'react-icons/fi';

const features = [
  { icon: FiUser, title: 'Perfil web', desc: 'Padres y conductores consultan su informacion.' },
  { icon: FiUsers, title: 'Estudiantes', desc: 'Padres ven hijos registrados; conductores ven estudiantes.' },
  { icon: FiTruck, title: 'Rutas y escuelas', desc: 'Conductores consultan sus rutas y escuelas asignadas.' },
  { icon: FiCreditCard, title: 'Pagos e historial', desc: 'Registros exportables en PDF o Excel.' },
];

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-busway-light">
      <Navbar />
      <section className="flex-grow bg-white px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <span className="relative h-28 w-28 overflow-hidden">
                <Image src="/logo.jpg" alt="BusWay" fill sizes="128px" className="object-contain" priority />
              </span>
              <div>
                <p className="text-7xl font-extrabold leading-none text-navy">
                  Bus<span className="text-busway-blue">Way</span>
                </p>
                <p className="mt-2 text-lg font-bold  text-navy">tus hijos <span className="text-busway-blue">seguros</span> en cada ruta</p>
              </div>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              BusWay tiene como objetivo principal digitalizar y hacer más seguro <br></br> el transporte escolar en Panamá, conectando a padres de familia con conductores verificados mediante una plataforma móvil y web. 
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/descargar" className="rounded-md bg-busway-yellow px-6 py-3 text-sm font-extrabold text-navy shadow-sm hover:bg-yellow-400">
                Descargar app
              </Link>
              <Link href="/login" className="rounded-md bg-navy px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-slate-900">
                Iniciar sesion
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-busway-light p-5">
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.title}
                    href="/funciones"
                    className="min-h-36 rounded-md border border-slate-200 bg-white p-4 transition hover:border-busway-blue"
                  >
                    <Icon className="text-busway-blue" size={24} />
                    <h2 className="mt-4 text-sm font-extrabold text-navy">{feature.title}</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{feature.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
