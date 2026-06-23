import './globals.css';

export const metadata = {
  title: 'CV Reformatter — Harvard/ATS Standard',
  description: 'Upload CV kamu dan dapatkan versi Harvard/ATS yang siap digunakan.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
