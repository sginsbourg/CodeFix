import CodeFixClientPage from '@/components/pages/code-fix-client-page';
import fs from 'fs';
import path from 'path';

export default function Home() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  const version = packageJson.version;

  return <CodeFixClientPage version={version} />;
}
