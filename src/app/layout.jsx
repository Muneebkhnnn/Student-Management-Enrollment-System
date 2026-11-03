import "./globals.css";

export const metadata = {
  title: "Student enrollment",
  description: "Register students and keep enrollment records accurate.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
