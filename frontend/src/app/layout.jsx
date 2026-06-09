import Script from 'next/script';
import '../index.css';

export const metadata = {
  title: 'Trade Journal',
  description: 'Forex Trading Journal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body>
        <Script id="smart-inventory-theme" strategy="beforeInteractive">
          {`
            try {
              var savedTheme = localStorage.getItem('si_theme') || 'light';
              document.documentElement.dataset.theme = savedTheme;
            } catch (_) {
              document.documentElement.dataset.theme = 'light';
            }
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
