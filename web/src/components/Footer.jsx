import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0D1B2A] px-6 py-16 text-white border-t border-white/5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3">
        
        {/* Columna 1: Logo y Descripción */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#1E3A8A] bg-white shadow-md">
              <Image 
                src="/logo.jpg" 
                alt="BusWay" 
                fill 
                sizes="40px" 
                className="object-cover" 
              />
            </span>
            <p className="text-xl font-black tracking-tight text-white">
              Bus<span className="text-[#3B82F6]">Way</span>
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-gray-400">
            Plataforma digital de transporte escolar para Panamá.
            Conectamos familias con conductores verificados.
          </p>
        </div>

        {/* Columna 2: Enlaces de la Plataforma */}
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            Plataforma
          </h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>
              <Link href="/funciones" className="transition-colors hover:text-[#3B82F6]">
                Funciones web
              </Link>
            </li>
            <li>
              <Link href="/como-funciona" className="transition-colors hover:text-[#3B82F6]">
                App Móvil
              </Link>
            </li>
            <li>
              <Link href="/descargar" className="transition-colors hover:text-[#3B82F6]">
                Descargar
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-[#3B82F6]">
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Información de Contacto */}
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            Contacto
          </h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="transition-colors hover:text-white">
              <a href="mailto:soporte@busway.pa">soporte@busway.pa</a>
            </li>
            <li className="transition-colors hover:text-white">
              <a href="tel:+50760000000">+507 6000-0000</a>
            </li>
            <li className="text-gray-400">
              Panamá, República de Panamá
            </li>
          </ul>
        </div>
      </div>

      {/* Línea divisoria y Copyright */}
      <div className="mx-auto mt-16 max-w-6xl border-t border-white/10 pt-8 text-center text-xs tracking-wide text-gray-500">
        &copy; {new Date().getFullYear()} BusWay - Grupo 1GS141 - Universidad Tecnológica de Panamá
      </div>
    </footer>
  );
}