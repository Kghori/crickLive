import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import { AdPopupProvider } from '@/components/AdPopupProvider';

const LiveScore = lazy(() => import('./pages/LiveScore'));
const Upcoming = lazy(() => import('./pages/Upcoming'));
const News = lazy(() => import('./pages/News'));
const MatchDetails = lazy(() => import('./pages/MatchDetails'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdPopupProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<LiveScore />} />
                  <Route path="/upcoming" element={<Upcoming />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/match/:id" element={<MatchDetails />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </AdPopupProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
