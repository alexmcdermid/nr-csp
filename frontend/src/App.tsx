import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { LoadingScreen } from '@/components/core/LoadingScreen';
import Layout from '@/components/Layout';
import { queryClient } from '@/config/react-query/config';
import { AuthProvider } from '@/context/auth/AuthProvider';
import { IdleTimeoutWatcher } from '@/context/auth/IdleTimeoutWatcher';
import { NotificationProvider } from '@/context/notification/NotificationProvider';
import PageTitleProvider from '@/context/pageTitle/PageTitleProvider';
import { ThemeProvider } from '@/context/theme/ThemeProvider';
import { WelcomePage } from '@/pages/Welcome';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ROUTES } from '@/routes/routePaths';

// Route-level code splitting: each page becomes its own chunk, loaded on
// first navigation instead of shipping in the initial bundle.
const FlatPriceConversionPage = lazy(() =>
  import('@/pages/FlatPriceConversion').then((m) => ({ default: m.FlatPriceConversionPage })),
);
const InvoicePage = lazy(() => import('@/pages/Invoice').then((m) => ({ default: m.InvoicePage })));
const InboxPage = lazy(() => import('@/pages/Inbox').then((m) => ({ default: m.InboxPage })));
const SearchPage = lazy(() => import('@/pages/Search').then((m) => ({ default: m.SearchPage })));
const SubmissionHistoryPage = lazy(() =>
  import('@/pages/SubmissionHistory').then((m) => ({ default: m.SubmissionHistoryPage })),
);
const ViewSubmissionPage = lazy(() =>
  import('@/pages/ViewSubmission').then((m) => ({ default: m.ViewSubmissionPage })),
);
const UploadSubmissionPage = lazy(() =>
  import('@/pages/UploadSubmission').then((m) => ({ default: m.UploadSubmissionPage })),
);
const NotFoundPage = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage })));
const SortCodePage = lazy(() => import('@/pages/SortCode').then((m) => ({ default: m.SortCodePage })));
const R06InvoicePrintOutPage = lazy(() =>
  import('@/pages/R06InvoicePrintOut').then((m) => ({ default: m.R06InvoicePrintOutPage })),
);
const R07ReconciliationPage = lazy(() =>
  import('@/pages/R07Reconciliation').then((m) => ({ default: m.R07ReconciliationPage })),
);
const R08InvoiceAuditPage = lazy(() =>
  import('@/pages/R08InvoiceAudit').then((m) => ({ default: m.R08InvoiceAuditPage })),
);
const R10LogSalesSpeciesPage = lazy(() =>
  import('@/pages/R10LogSalesSpecies').then((m) => ({ default: m.R10LogSalesSpeciesPage })),
);
const R11AverageMarketValuesPage = lazy(() =>
  import('@/pages/R11AverageMarketValues').then((m) => ({ default: m.R11AverageMarketValuesPage })),
);
const R12CfpaExtractPage = lazy(() =>
  import('@/pages/R12CfpaExtract').then((m) => ({ default: m.R12CfpaExtractPage })),
);
const R13AdHocReportingPage = lazy(() =>
  import('@/pages/R13AdHocReporting').then((m) => ({ default: m.R13AdHocReportingPage })),
);

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : () => null;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <IdleTimeoutWatcher />
            <PageTitleProvider>
              <BrowserRouter>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    {/* The welcome screen — accessible without authentication, and
                        rendered outside the app shell (it has no header or side nav
                        of the shell's kind) */}
                    <Route path={ROUTES.LANDING} element={<WelcomePage />} />

                    {/* Older /logout bookmarks return to the welcome screen. CSS logout returns directly to root. */}
                    <Route path={ROUTES.LOGOUT} element={<Navigate to={ROUTES.LANDING} replace />} />

                    {/* All other routes share the shell layout and require authentication */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }
                    >
                      <Route
                        path={ROUTES.SEARCH}
                        element={
                          <ProtectedRoute>
                            <SearchPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.SUBMISSION_HISTORY}
                        element={
                          <ProtectedRoute>
                            <SubmissionHistoryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={`${ROUTES.SUBMISSION_HISTORY}/:submissionId`}
                        element={
                          <ProtectedRoute>
                            <ViewSubmissionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.UPLOAD_SUBMISSION}
                        element={
                          <ProtectedRoute>
                            <UploadSubmissionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.INBOX}
                        element={
                          <ProtectedRoute>
                            <InboxPage />
                          </ProtectedRoute>
                        }
                      />
                      {/* New invoice (no id) and existing invoice (/:id) both
                        render InvoicePage; it branches on the presence of the
                        route param. */}
                      <Route
                        path={ROUTES.INVOICE}
                        element={
                          <ProtectedRoute>
                            <InvoicePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={`${ROUTES.INVOICE}/:id`}
                        element={
                          <ProtectedRoute>
                            <InvoicePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.SORT_CODE}
                        element={
                          <ProtectedRoute>
                            <SortCodePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.FLAT_PRICE_CONVERSION}
                        element={
                          <ProtectedRoute>
                            <FlatPriceConversionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R06_INVOICE_PRINT_OUT}
                        element={
                          <ProtectedRoute>
                            <R06InvoicePrintOutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R07_RECONCILIATION}
                        element={
                          <ProtectedRoute>
                            <R07ReconciliationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R08_INVOICE_AUDIT}
                        element={
                          <ProtectedRoute>
                            <R08InvoiceAuditPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R10_LOG_SALES_SPECIES}
                        element={
                          <ProtectedRoute>
                            <R10LogSalesSpeciesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R11_AMV}
                        element={
                          <ProtectedRoute>
                            <R11AverageMarketValuesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R12_CFPA_EXTRACT}
                        element={
                          <ProtectedRoute>
                            <R12CfpaExtractPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.R13_AD_HOC}
                        element={
                          <ProtectedRoute>
                            <R13AdHocReportingPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </PageTitleProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
