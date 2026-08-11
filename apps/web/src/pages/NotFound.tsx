import { Link } from 'react-router-dom';

import { useI18n } from '../i18n';

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-indigo-500">404</p>
      <p className="mt-4 text-slate-400">Page not found</p>
      <Link
        to="/"
        className="mt-8 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
      >
        {t.common.back}
      </Link>
    </div>
  );
}
