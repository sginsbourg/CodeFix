'use client';

import { useState, useRef, type DragEvent, ChangeEvent, MouseEvent, useEffect } from 'react';
import {
  FileCode2,
  UploadCloud,
  Wand2,
  Download,
  Loader2,
  FileText,
  FileIcon,
  X,
  Trash2,
  BookMarked,
  ClipboardPaste,
  Eye,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { fixCodeAction, generateReadmeAction, getReadmeAction } from '@/app/actions';
import type { SuggestCodeFixesOutput } from '@/ai/types/suggest-code-fixes-types';
import { Skeleton } from '@/components/ui/skeleton';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import batch from 'react-syntax-highlighter/dist/esm/languages/prism/batch';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { Checkbox } from '@/components/ui/checkbox';


import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('batch', batch);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);

type SupportedLanguage = 'python' | 'batch' | 'plaintext' | 'markdown' | 'javascript' | 'typescript';

type UploadedFile = {
  name: string;
  content: string;
  language: SupportedLanguage;
};

type CorrectedFile = {
  name: string;
  correctedCode: string;
}

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};


export default function CodeFixClientPage({ version }: { version: string }) {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<SuggestCodeFixesOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const [fixError, setFixError] = useState<boolean>(true);
  const [improveErrorHandling, setImproveErrorHandling] = useState<boolean>(true);
  const [addDebugging, setAddDebugging] = useState<boolean>(true);
  const [enhanceUserMessages, setEnhanceUserMessages] = useState<boolean>(true);

  const [isGeneratingReadme, setIsGeneratingReadme] = useState<boolean>(false);
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  
  const [isReviewingReadme, setIsReviewingReadme] = useState<boolean>(false);
  const [existingReadme, setExistingReadme] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Hydration-safe state initialization from localStorage
  useEffect(() => {
    setFiles(getInitialState('files', []));
    setSelectedFile(getInitialState('selectedFile', null));
    setErrorMessage(getInitialState('errorMessage', ''));
    setAnalysisResult(getInitialState('analysisResult', null));
    setGeneratedReadme(getInitialState('generatedReadme', null));
    setFixError(getInitialState('fixError', true));
    setImproveErrorHandling(getInitialState('improveErrorHandling', true));
    setAddDebugging(getInitialState('addDebugging', true));
    setEnhanceUserMessages(getInitialState('enhanceUserMessages', true));
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('files', JSON.stringify(files));
    }
  }, [files]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedFile', JSON.stringify(selectedFile));
    }
  }, [selectedFile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('errorMessage', JSON.stringify(errorMessage));
    }
  }, [errorMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult));
    }
  }, [analysisResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('generatedReadme', JSON.stringify(generatedReadme));
    }
  }, [generatedReadme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fixError', JSON.stringify(fixError));
    }
  }, [fixError]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('improveErrorHandling', JSON.stringify(improveErrorHandling));
    }
  }, [improveErrorHandling]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('addDebugging', JSON.stringify(addDebugging));
    }
  }, [addDebugging]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('enhanceUserMessages', JSON.stringify(enhanceUserMessages));
    }
  }, [enhanceUserMessages]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;
    const rotateX = (y / height) * -2; // Reduced intensity
    const rotateY = (x / width) * 2; // Reduced intensity
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
    if (extension === 'md') return 'markdown';
    if (extension === 'js' || extension === 'jsx') return 'javascript';
    if (extension === 'ts' || extension === 'tsx') return 'typescript';
    return 'plaintext';
  };
  
  const getFileIcon = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'python':
      case 'batch':
      case 'javascript':
      case 'typescript':
        return <FileCode2 className="h-6 w-6 text-primary" />;
      case 'markdown':
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
    setFiles(prev => {
      const remainingFiles = prev.filter(f => f.name !== fileName);
      if (selectedFile?.name === fileName) {
        setAnalysisResult(null);
        setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
      }
      return remainingFiles;
    });
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
    if (files.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload at least one code file.' });
      return;
    }
    if (!errorMessage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter an error message.' });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setGeneratedReadme(null);
    setExistingReadme(null);
    const result = await fixCodeAction({
      files: files.map(f => ({name: f.name, content: f.content})),
      errorMessage,
      fixError,
      improveErrorHandling,
      addDebugging,
      enhanceUserMessages,
    });
    setIsLoading(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Analysis Error', description: result.error });
    } else if (result.data) {
      setAnalysisResult(result.data);
      if (result.data.correctedFiles.length > 0) {
        const firstCorrectedFile = files.find(f => f.name === result.data.correctedFiles[0].name);
        if (firstCorrectedFile) {
          setSelectedFile(firstCorrectedFile);
        }
      }
      toast({ title: 'Success', description: 'Code analysis complete!' });
    }
  };

  const handleGenerateReadme = async () => {
    if (!analysisResult) return;

    setIsGeneratingReadme(true);
    setGeneratedReadme(null);

    const projectFiles = files.map(originalFile => {
      const correctedVersion = analysisResult.correctedFiles.find(cf => cf.name === originalFile.name);
      return {
        name: originalFile.name,
        content: correctedVersion ? correctedVersion.correctedCode : originalFile.content,
      };
    });

    const result = await generateReadmeAction({ files: projectFiles });
    setIsGeneratingReadme(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'README Generation Error', description: result.error });
    } else if (result.data) {
      setGeneratedReadme(result.data.readme);
      toast({ title: 'Success', description: 'README.md generated!' });
    }
  };

  const handleReviewReadme = async () => {
    setIsReviewingReadme(true);
    setExistingReadme(null);
    const result = await getReadmeAction();
    setIsReviewingReadme(false);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else if (result.data) {
      setExistingReadme(result.data);
    }
  };

  const handleDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
    setAnalysisResult(null);
    setGeneratedReadme(null);
    setErrorMessage('');
    setExistingReadme(null);
    
    // Clear relevant localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('files');
      localStorage.removeItem('selectedFile');
      localStorage.removeItem('errorMessage');
      localStorage.removeItem('analysisResult');
      localStorage.removeItem('generatedReadme');
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setErrorMessage(text);
      toast({ title: 'Success', description: 'Pasted error message from clipboard.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not read from clipboard. Please check permissions.' });
      console.error('Failed to read clipboard contents: ', error);
    }
  };

  const getCorrectedCodeForFile = (fileName: string | undefined): string | null => {
    if (!fileName || !analysisResult) return null;
    const correctedFile = analysisResult.correctedFiles.find(f => f.name === fileName);
    return correctedFile?.correctedCode ?? null;
  }
  
  const correctedFileForSelected = selectedFile ? getCorrectedCodeForFile(selectedFile.name) : null;

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-grid p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl rounded-lg border bg-card/80 shadow-2xl backdrop-blur-lg">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <header className="relative text-center mb-10">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
              CodeFix <span className="text-2xl text-muted-foreground font-light align-middle">v{version}</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Your AI-powered assistant for debugging code.
            </p>
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href="https://github.com/sginsbourg/CodeFix" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon">
                      <Github className="h-5 w-5" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                  </a>
                </TooltipTrigger>
                <TooltipContent>View on GitHub</TooltipContent>
              </Tooltip>
            </div>
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
                  <CardDescription>Upload files, paste the error, and select your desired improvements.</CardDescription>
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
                        accept=".py,.bat,.cmd,.txt,.md,.js,.ts,.jsx,.tsx"
                        multiple
                      />
                      <div className="text-center text-muted-foreground">
                        <UploadCloud className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs">JS, TS, Python, Batch, Text, or MD files (up to 10)</p>
                      </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Uploaded Files</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={clearAllFiles}>
                              <Trash2 className="mr-2 h-4 w-4"/>
                              Clear all
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear all uploaded files and session data</TooltipContent>
                        </Tooltip>
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
                            onClick={() => { setSelectedFile(file); }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getFileIcon(file.language)}
                              <span className="truncate text-sm">{file.name}</span>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove this file</TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="error-message">Error Message</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={handlePasteFromClipboard} disabled={files.length === 0}>
                            <ClipboardPaste className="mr-2 h-4 w-4"/>
                            Paste from Clipboard
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Paste error message from your clipboard</TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      id="error-message"
                      placeholder="Paste your error message here..."
                      className="min-h-[120px] font-code text-sm"
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      disabled={files.length === 0}
                    />
                  </div>

                  <div className="space-y-4">
                      <Label>AI Improvements</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="fix-error" checked={fixError} onCheckedChange={(checked) => setFixError(Boolean(checked))} />
                          <Label htmlFor="fix-error" className="text-sm font-normal">Fix error</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="improve-error-handling" checked={improveErrorHandling} onCheckedChange={(checked) => setImproveErrorHandling(Boolean(checked))} />
                          <Label htmlFor="improve-error-handling" className="text-sm font-normal">Improve error handling</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="add-debugging" checked={addDebugging} onCheckedChange={(checked) => setAddDebugging(Boolean(checked))} />
                          <Label htmlFor="add-debugging" className="text-sm font-normal">Increase debugging</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="enhance-user-messages" checked={enhanceUserMessages} onCheckedChange={(checked) => setEnhanceUserMessages(Boolean(checked))} />
                          <Label htmlFor="enhance-user-messages" className="text-sm font-normal">Enhance user messages</Label>
                        </div>
                      </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleReviewReadme} disabled={isReviewingReadme}>
                        {isReviewingReadme ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          Review README
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View the project's current README.md file</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleSubmit} disabled={isLoading || files.length === 0}>
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Fix Code
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Analyze files and generate code fixes</TooltipContent>
                  </Tooltip>
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

              {!isLoading && (existingReadme || analysisResult) && (
                <>
                  {existingReadme && !analysisResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-headline text-xl">README.md</CardTitle>
                        <CardDescription>This is the current README.md file for your project.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-96 rounded-md border bg-muted/30 p-4">
                          <pre className="text-sm whitespace-pre-wrap font-code">{existingReadme}</pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                
                  {analysisResult && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-headline text-xl">Explanation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.explanation}</p>
                        </CardContent>
                      </Card>
    
                      {analysisResult.correctedFiles.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="font-headline text-xl">Corrected Files</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {analysisResult.correctedFiles.map(file => (
                              <div key={file.name} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                                <span className="font-code text-sm">{file.name}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="secondary" onClick={() => handleDownload(file.correctedCode, file.name)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download corrected version of {file.name}</TooltipContent>
                                </Tooltip>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
    
                      {selectedFile && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="font-headline text-lg">Original Code ({selectedFile.name})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <SyntaxHighlighter language={selectedFile.language} style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '500px' }} codeTagProps={{ className: 'font-code' }}>
                                {selectedFile.content}
                              </SyntaxHighlighter>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                              <CardTitle className="font-headline text-lg">Corrected Code</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              {correctedFileForSelected ? (
                                <SyntaxHighlighter language={selectedFile.language} style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '500px' }} codeTagProps={{ className: 'font-code' }}>
                                  {correctedFileForSelected}
                                </SyntaxHighlighter>
                              ) : (
                                <div className="flex items-center justify-center h-full p-6 text-center text-muted-foreground rounded-b-lg bg-muted/20">
                                  <p>No changes suggested for this file.</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
    
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-headline text-xl">Generate README</CardTitle>
                          <CardDescription>Create a README.md file for your project based on the latest code.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={handleGenerateReadme} disabled={isGeneratingReadme}>
                                {isGeneratingReadme ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <BookMarked className="mr-2 h-4 w-4" />
                                )}
                                Generate README.md
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Generate a new README.md based on the corrected code</TooltipContent>
                          </Tooltip>
                          {isGeneratingReadme && (
                            <div className="mt-4 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          )}
                          {generatedReadme && (
                             <div className="mt-4 rounded-md border bg-muted/30 p-4">
                                <h4 className="font-semibold mb-2">Generated README.md</h4>
                                <ScrollArea className="h-64">
                                    <pre className="text-sm whitespace-pre-wrap font-code">{generatedReadme}</pre>
                                </ScrollArea>
                             </div>
                          )}
                        </CardContent>
                        {generatedReadme && (
                            <CardFooter>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="secondary" onClick={() => handleDownload(generatedReadme, 'README.md')}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download README.md
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download the generated README.md file</TooltipContent>
                              </Tooltip>
                            </CardFooter>
                        )}
                      </Card>
                    </>
                  )}
                </>
              )}

              {!isLoading && !analysisResult && !existingReadme && (
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
    </TooltipProvider>
  );
}
