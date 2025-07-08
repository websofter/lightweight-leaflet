// Интерфейсы для типизации
interface MapKitInfo {
  version: string;
  url: string;
  size: number;
  content?: string;
  contentType: string;
  timestamp: string;
  functions?: string[];
  classes?: string[];
  variables?: string[];
}

interface ParsedData {
  csrData: MapKitInfo;
  mapkitData: MapKitInfo;
}

function extractVersion(url: string): string {
  const versionMatch = url.match(/(\d+\.\d+\.\d+)/);
  return versionMatch ? versionMatch[1] : 'unknown';
}

function extractFunctions(content: string): string[] {
  const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  const arrowFunctionRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/g;
  const methodRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/g;
  
  const functions: string[] = [];
  let match;
  
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1]);
  }
  
  while ((match = arrowFunctionRegex.exec(content)) !== null) {
    functions.push(match[1]);
  }
  
  while ((match = methodRegex.exec(content)) !== null) {
    if (!functions.includes(match[1])) {
      functions.push(match[1]);
    }
  }
  
  return [...new Set(functions)];
}

function extractClasses(content: string): string[] {
  const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const classes: string[] = [];
  let match;
  
  while ((match = classRegex.exec(content)) !== null) {
    classes.push(match[1]);
  }
  
  return [...new Set(classes)];
}

function extractVariables(content: string): string[] {
  const varRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const variables: string[] = [];
  let match;
  
  while ((match = varRegex.exec(content)) !== null) {
    variables.push(match[1]);
  }
  
  return [...new Set(variables)];
}


// Утилитарные функции
export async function fetchAndParseContent(url: string, headers: Record<string, string> | null = null): Promise<string> {
  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: headers || {}
  };
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.text();
    return content
}
export async function fetchAndParse(url: string): Promise<MapKitInfo> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'application/javascript';
    
    // Парсинг JavaScript кода для извлечения функций, классов и переменных
    const functions = extractFunctions(content);
    const classes = extractClasses(content);
    const variables = extractVariables(content);
    
    return {
      version: extractVersion(url),
      url,
      size: content.length,
      content: content,
      contentType,
      timestamp: new Date().toISOString(),
      functions: functions.slice(0, 20), // Ограничиваем количество для читаемости
      classes: classes.slice(0, 20),
      variables: variables.slice(0, 20)
    };
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

