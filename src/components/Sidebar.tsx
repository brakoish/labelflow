'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenTool, Layers, Tag, Printer } from 'lucide-react';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Designer', Icon: PenTool },
  { href: '/formats', label: 'Label Formats', Icon: Layers },
  { href: '/labels', label: 'My Labels', Icon: Tag },
  { href: '/print', label: 'Print', Icon: Printer },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Label Wrangler" className="w-8 h-8 text-indigo-400" style={{ filter: 'invert(55%) sepia(52%) saturate(5765%) hue-rotate(222deg) brightness(100%) contrast(93%)' }} />
          <div>
            <h1 className="text-xl font-bold text-white">Label Wrangler</h1>
            <p className="text-sm text-gray-400">Label Designer</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">Label Wrangler v1.0</p>
      </div>
    </aside>
  );
}
