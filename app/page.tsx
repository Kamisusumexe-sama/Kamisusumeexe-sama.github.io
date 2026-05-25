import fs from 'fs';
import path from 'path';

export default function Home() {
  const indexPath = path.join(process.cwd(), 'index.html');
  const htmlContent = fs.readFileSync(indexPath, 'utf-8');

  return (
    <div
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
