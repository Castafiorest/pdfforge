import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { I18nProvider } from './i18n';
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

const CompressPage = lazy(() => import('./pages/Compress').then((m) => ({ default: m.CompressPage })));
const MergePage = lazy(() => import('./pages/Merge').then((m) => ({ default: m.MergePage })));
const SplitPage = lazy(() => import('./pages/Split').then((m) => ({ default: m.SplitPage })));
const OrganizePage = lazy(() => import('./pages/Organize').then((m) => ({ default: m.OrganizePage })));
const ImageToPdfPage = lazy(() => import('./pages/ImageToPdf').then((m) => ({ default: m.ImageToPdfPage })));
const PdfToImagePage = lazy(() => import('./pages/PdfToImage').then((m) => ({ default: m.PdfToImagePage })));
const RemoveMetadataPage = lazy(() =>
  import('./pages/RemoveMetadata').then((m) => ({ default: m.RemoveMetadataPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="/tools/compress" element={<CompressPage />} />
                <Route path="/tools/merge" element={<MergePage />} />
                <Route path="/tools/split" element={<SplitPage />} />
                <Route path="/tools/organize" element={<OrganizePage />} />
                <Route path="/tools/image-to-pdf" element={<ImageToPdfPage />} />
                <Route path="/tools/pdf-to-image" element={<PdfToImagePage />} />
                <Route path="/tools/remove-metadata" element={<RemoveMetadataPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  );
}
