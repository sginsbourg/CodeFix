# CodeFix: Your AI-Powered Code Assistant

CodeFix is a Next.js application that leverages generative AI to help you debug your code. You can upload your code files, provide an error message, and the AI will suggest fixes, offer explanations, and even help you improve your code quality.

## Getting Started

To get started with CodeFix, simply open the application in your browser. The main interface is divided into two sections: the input panel on the left and the output/results panel on the right.

## User Manual

### 1. Upload Your Code Files

- Click on the "Click to upload" area or drag and drop your code files (`.py`, `.bat`, `.cmd`, `.txt`, `.md`) into the designated zone.
- You can upload up to 10 files for analysis.
- Your uploaded files will appear in a list. You can click on a file to view its content or remove it by clicking the 'X' icon.

### 2. Provide the Error Message

- Paste the error message you received from your code into the "Error Message" text area.
- You can also click the "Paste from Clipboard" button to quickly paste an error message you have copied.

### 3. Select AI Improvements

Before running the analysis, you can choose what kind of improvements you want the AI to make:
- **Fix error:** The primary function to correct the bug causing the error.
- **Improve error handling:** Enhance the code with more robust error handling, like `try-catch` blocks.
- **Increase debugging:** Add logging statements or other debugging aids to the code.
- **Enhance user messages:** Improve any text that is displayed to the user to be more informative and clear.

Your selections are automatically saved in your browser, so you don't have to re-select them every time.

### 4. Analyze and Fix Your Code

- Click the **Fix Code** button to start the analysis.
- The AI will process your files and the error message. During this time, a loading indicator will be displayed.
- Once complete, the results will appear on the right side of the screen.

### 5. Review the Results

The results panel will show you:
- **Explanation:** A detailed explanation of what caused the error and how the AI fixed it.
- **Corrected Files:** A list of files that were modified. You can download each corrected file individually.
- **Code Diff Viewer:** A side-by-side comparison of the original and corrected code for the currently selected file.

### 6. Generate a New README.md

- After a successful analysis, a "Generate README" section will appear.
- Click the **Generate README.md** button to have the AI create a new, comprehensive README file based on your corrected project files.
- You can preview the generated README and download it.

### 7. Manage Your Session

- **Review README:** Click the "Review README" button at any time to view the current `README.md` file of your project.
- **Start a New Session:** Click the **Clear all** button to remove all uploaded files, error messages, and analysis results, allowing you to start fresh.
- **Automatic Caching:** Your entire session (uploaded files, error message, results, and selections) is automatically saved in your browser. You can refresh the page or close the tab and resume your work later.

## Local Development

Follow these instructions to set up and run the project on your local machine for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Google AI API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 1. Clone the Repository

First, clone this repository to your local machine:

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

Install all the necessary project dependencies using npm:

```bash
npm install
```

### 3. Set Up Environment Variables

The project uses Genkit and the Gemini API, which require an API key.

1.  Create a new file named `.env` in the root of your project directory.
2.  Copy the contents of the `.env.example` file into your new `.env` file.
3.  Replace the placeholder with your actual Google AI API key:

```
GEMINI_API_KEY=your_google_ai_api_key_here
```

The application uses `dotenv` to automatically load this variable during development.

### 4. Run the Application

This project consists of two main parts that need to be run concurrently in separate terminals: the Next.js frontend application and the Genkit AI flows.

**Terminal 1: Start the Next.js Development Server**

This command starts the Next.js frontend on `http://localhost:9002`.

```bash
npm run dev
```

**Terminal 2: Start the Genkit Development Server**

This command starts the Genkit development UI, which allows you to inspect and debug your AI flows. It typically runs on `http://localhost:4000`.

```bash
npm run genkit:dev
```

Once both servers are running, you can open your browser and navigate to `http://localhost:9002` to use the CodeFix application.
