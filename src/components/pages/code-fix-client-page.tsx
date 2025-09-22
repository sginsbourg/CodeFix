'use client';

import { useState, useRef, type DragEvent, ChangeEvent, MouseEvent } from 'react';
import {
  FileCode2,
  UploadCloud,
  Wand2,
  Play,
  Download,
  Loader2,
  FileText,
  File as FileIcon,
  X,
  Trash2,
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
import { ScrollArea } from '@/components/ui/scroll-area';

type SupportedLanguage = 'python' | 'batch' | 'plaintext';

type UploadedFile = {
  name: string;
  content: string;
  language: SupportedLanguage;
};

export default function CodeFixClientPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<SuggestCodeFixesOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;
    const rotateX = (y / height) * -5; // Reduced intensity
    const rotateY = (x / width) * 5; // Reduced intensity
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`; // Reduced scale
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

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
        return <FileCode2 className="h-6 w-6 text-primary" />;
      case 'plaintext':
        return <FileText className="h-6 w-6 text-muted-foreground" />;
      default:
        return <FileIcon className="h-6 w-6 text-muted-foreground" />;
    }
  }

  const handleFiles = (fileList: FileList) => {
    if (files.length + fileList.length > 10) {
      toast({ variant: 'destructive', title: 'Error', description: 'You can upload a maximum of 10 files.' });
      return;
    }
    
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile = {
          name: file.name,
          content: content,
          language: getLanguageFromFileName(file.name),
        };
        setFiles(prev => {
          const newFiles = [...prev, newFile];
          if (newFiles.length === 1) {
            setSelectedFile(newFiles[0]);
          }
          return newFiles;
        });
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleFiles(e.target.files);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    if (selectedFile?.name === fileName) {
      setAnalysisResult(null);
      setSelectedFile(files.length > 1 ? files.find(f => f.name !== fileName) || null : null);
    }
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
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a code file to fix.' });
      return;
    }
    if (!errorMessage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter an error message.' });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    const result = await fixCodeAction({ code: selectedFile.content, errorMessage });
    setIsLoading(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Analysis Error', description: result.error });
    } else if (result.data) {
      setAnalysisResult(result.data);
      toast({ title: 'Success', description: 'Code analysis complete!' });
    }
  };

  const handleDownload = () => {
    if (!analysisResult?.correctedCode || !selectedFile) return;
    const blob = new Blob([analysisResult.correctedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const [name, ...extParts] = selectedFile.name.split('.');
    const extension = extParts.join('.');
    a.href = url;
    a.download = extension ? `${name}.fixed.${extension}` : `${name}.fixed.txt`;
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
    setAnalysisResult(null);
  }

  return (
    <div className="min-h-screen bg-grid p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl rounded-lg border bg-card/80 shadow-2xl backdrop-blur-lg">
        <main className="container mx-auto px-4 py-8 md:py-12">
          <header className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              CodeFix
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Your AI-powered assistant for debugging code.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start perspective">
            <div
              ref={cardRef}
              className="sticky top-8 transform-style-3d transition-transform duration-300"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="w-full h-full backface-hidden">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Input</CardTitle>
                  <CardDescription>Upload files and paste the error message.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Code Files</Label>
                    <div
                      id="file-upload"
                      className={cn(
                        'relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors',
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
                        onChange={handleFileChange}
                        accept=".py,.bat,.cmd,.txt"
                        multiple
                      />
                      <div className="text-center text-muted-foreground">
                        <UploadCloud className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs">Python, Batch, or Text files (up to 10)</p>
                      </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Uploaded Files</Label>
                        <Button variant="ghost" size="sm" onClick={clearAllFiles}>
                          <Trash2 className="mr-2 h-4 w-4"/>
                          Clear all
                        </Button>
                      </div>
                      <ScrollArea className="h-48 rounded-md border">
                        <div className="p-2 space-y-2">
                        {files.map((file) => (
                          <div
                            key={file.name}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer",
                              selectedFile?.name === file.name ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                            )}
                            onClick={() => { setSelectedFile(file); setAnalysisResult(null); }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getFileIcon(file.language)}
                              <span className="truncate text-sm">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="error-message">Error Message</Label>
                    <Textarea
                      id="error-message"
                      placeholder="Paste your error message here..."
                      className="min-h-[120px] font-code text-sm"
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      disabled={files.length === 0}
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
                  <Button onClick={handleSubmit} disabled={isLoading || !selectedFile}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Fix Code
                  </Button>
                </CardFooter>
              </Card>
            </div>
            

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

              {!isLoading && analysisResult && selectedFile && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-headline text-lg">Original Code ({selectedFile.name})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <SyntaxHighlighter language={selectedFile.language} style={atomOneDark} showLineNumbers customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '500px' }} codeTagProps={{ className: 'font-code' }}>
                          {selectedFile.content}
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
                        <SyntaxHighlighter language={selectedFile.language} style={atomOneDark} showLineNumbers customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '500px' }} codeTagProps={{ className: 'font-code' }}>
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
                    <h3 className="mt-4 text-lg font-medium font-headline">
                      {files.length === 0 ? 'Upload Files to Get Started' : 'Waiting for Analysis'}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {files.length === 0
                        ? 'Upload one or more code files to begin.'
                        : 'Your corrected code and explanation will appear here.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
