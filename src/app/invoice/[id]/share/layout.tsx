import { WebHeader } from '@/components/layout/web-header';
import { WebFooter } from '@/components/layout/web-footer';
import { LanguageProvider } from '@/app/language-provider';

export default function SharedInvoiceWebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="flex flex-col min-h-screen">
        <WebHeader className="no-print" />
        <main className="flex-1 flex items-center justify-center bg-muted/40 p-4 printable-area">
            {children}
        </main>
        <WebFooter className="no-print" />
      </div>
    </LanguageProvider>
  );
}
