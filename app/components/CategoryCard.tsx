import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  description: string;
  icon: string;
  gradient: string;
  count: number;
}

export default function CategoryCard({ name, description, icon, gradient, count }: CategoryCardProps) {
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(name)}`}
      className="group block"
      aria-label={`Browse ${name} — ${count} product${count !== 1 ? 's' : ''}`}
    >
      <article className="product-card glass-card rounded-2xl p-6 h-full flex flex-col">
        {/* Icon circle */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
          <span className="text-2xl" role="img" aria-label={name}>{icon}</span>
        </div>

        {/* Text */}
        <h3 className="text-white font-semibold text-base mb-1">{name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-4">{description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-400 font-medium">
            {count} product{count !== 1 ? 's' : ''}
          </span>
          <ArrowRight
            className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-150"
            aria-hidden="true"
          />
        </div>
      </article>
    </Link>
  );
}
