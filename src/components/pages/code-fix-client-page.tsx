'use client';

import { useState, useRef, type DragEvent } from 'react';
import {
  FileCode2,
  UploadCloud,
  Wand2,
  Play,
  Download,
  Loader2,
  FileText,
  File as FileIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { fixCodeAction } from '@/app/actions';
import type { SuggestCodeFixesOutput } from '@/ai/flows/suggest-code-fixes';
import { Skeleton } from '@/components/ui/skeleton';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { cn } from '@/lib/utils';

type SupportedLanguage = 'python' | 'batch' | 'plaintext';

export default function CodeFixClientPage() {
  const { toast } = useToast();
  const [originalCode, setOriginalCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>('plaintext');
  const [analysisResult, setAnalysisResult] = useState<SuggestCodeFixesOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLanguageFromFileName = (name: string): SupportedLanguage => {
    const extension = name.split('.').pop()?.toLowerCase();
    if (extension === 'py') return 'python';
    if (extension === 'bat' || extension === 'cmd') return 'batch';
    return 'plaintext';
  };
  
  const getFileIcon = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'python':
      case 'batch':
        return <FileCode2 className="h-10 w-10 text-primary" />;
      case 'plaintext':
        return <FileText className="h-10 w-10 text-muted-foreground" />;
      default:
        return <FileIcon className="h-10 w-10 text-muted-foreground" />;
    }
  }

  const handleFileChange = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setOriginalCode(content);
      setFileName(file.name);
      setLanguage(getLanguageFromFileName(file.name));
      setAnalysisResult(null);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!originalCode) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload a code file.' });
      return;
    }
    if (!errorMessage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter an error message.' });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    const result = await fixCodeAction({ code: originalCode, errorMessage });
    setIsLoading(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Analysis Error', description: result.error });
    } else if (result.data) {
      setAnalysisResult(result.data);
      toast({ title: 'Success', description: 'Code analysis complete!' });
    }
  };

  const handleDownload = () => {
    if (!analysisResult?.correctedCode) return;
    const blob = new Blob([analysisResult.correctedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const [name, ...extParts] = fileName.split('.');
    const extension = extParts.join('.');
    a.href = url;
    a.download = extension ? `${name}.fixed.${extension}` : `${name}.fixed.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            CodeFix
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Your AI-powered assistant for debugging code.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Input</CardTitle>
              <CardDescription>Upload your file and paste the error message.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Code File</Label>
                <div
                  id="file-upload"
                  className={cn(
                    'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors',
                    dragActive ? 'border-primary bg-accent/20' : 'border-border'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={onFileClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                    accept=".py,.bat,.cmd,.txt"
                  />
                  {fileName ? (
                    <div className="text-center">
                      {getFileIcon(language)}
                      <p className="mt-2 font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <UploadCloud className="mx-auto h-10 w-10" />
                      <p className="mt-2">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs">Python, Batch, or Text files</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="error-message">Error Message</Label>
                <Textarea
                  id="error-message"
                  placeholder="Paste your error message here..."
                  className="min-h-[120px] font-code text-sm"
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" disabled>
                      <Play className="mr-2 h-4 w-4" />
                      Run File
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>File execution is not supported in this environment for security reasons.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Fix Code
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-8">
            {isLoading && (
              <>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </>
            )}

            {!isLoading && analysisResult && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-headline text-lg">Original Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <SyntaxHighlighter language={language} style={atomOneDark} showLineNumbers customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '500px' }} codeTagProps={{ className: 'font-code' }}>
                        {originalCode}
                      </SyntaxHighlighter>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="font-headline text-lg">Corrected Code</CardTitle>
                       <Button size="sm" variant="secondary" onClick={handleDownload}>
                         <Download className="mr-2 h-4 w-4" /> Download
                       </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <SyntaxHighlighter language={language} style={atomOneDark} showLineNumbers customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '500px' }} codeTagProps={{ className: 'font-code' }}>
                        {analysisResult.correctedCode}
                      </SyntaxHighlighter>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Explanation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.explanation}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {!isLoading && !analysisResult && (
              <Card className="flex flex-col items-center justify-center text-center h-[50vh] border-dashed">
                <CardContent className="pt-6">
                  <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium font-headline">Waiting for Analysis</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your corrected code and explanation will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
