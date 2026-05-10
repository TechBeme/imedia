import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SoMedia", template: "%s | SoMedia" },
  description: "Gerencie todas as suas redes sociais em um so lugar",
  keywords: ["social media", "gerenciador", "instagram", "facebook", "threads", "marketing"],
  authors: [{ name: "SoMedia" }],
  metadataBase: new URL("https://somedia.techbe.me"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var locales = ["pt-BR","en","es"];
                var defaultLocale = "pt-BR";
                var cookieMatch = document.cookie.match(new RegExp("(^| )NEXT_LOCALE=([^;]+)"));
                var locale = cookieMatch ? cookieMatch[2] : null;
                if (!locale || !locales.includes(locale)) {
                  var navLang = typeof navigator !== "undefined" ? navigator.language : null;
                  if (navLang) {
                    var code = navLang.toLowerCase();
                    locale = locales.find(function(l) { return l.toLowerCase() === code; });
                    if (!locale) {
                      var langOnly = code.split("-")[0];
                      locale = locales.find(function(l) { return l.toLowerCase().startsWith(langOnly); });
                    }
                  }
                }
                if (!locale) locale = defaultLocale;
                var path = window.location.pathname;
                if (path === "/" || path === "") {
                  window.location.replace("/" + locale + "/dashboard");
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
