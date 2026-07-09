import './globals.css';

export const metadata = {
  title: 'NexSkill — La formation professionnelle qui se prouve',
  description: "Des compétences pratiques, un certificat vérifiable par QR code, et un accès direct aux entreprises qui recrutent."
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
