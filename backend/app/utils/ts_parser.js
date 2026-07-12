/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const path = require('path');

// Dynamically check if typescript is available
let ts;
try {
  ts = require('typescript');
} catch (err) {
  console.error("TypeScript compiler package is not available in node_modules.");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath || !fs.existsSync(filePath)) {
  console.error("Invalid or missing file path argument.");
  process.exit(2);
}

try {
  const code = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);

  const symbols = [];
  const imports = [];

  function visit(node) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const startLine = line + 1;
    const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;

    // 1. Extract Imports
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
    } else if (ts.isCallExpression(node)) {
      // Check require('module')
      if (
        node.expression &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        imports.push(node.arguments[0].text);
      }
    }

    // 2. Extract Exports, Classes, Functions, and Variables
    let name = null;
    let type = null;
    let exported = false;

    if (ts.isClassDeclaration(node) && node.name) {
      name = node.name.text;
      type = 'Class';
      exported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ? true : false;
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      name = node.name.text;
      type = 'Function';
      exported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ? true : false;
      
      // Heuristic for React Components (starts with uppercase)
      if (/^[A-Z]/.test(name)) {
        type = 'Component';
      } else if (/^use[A-Z]/.test(name)) {
        type = 'Hook';
      }
    } else if (ts.isInterfaceDeclaration(node) && node.name) {
      name = node.name.text;
      type = 'Interface';
      exported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ? true : false;
    } else if (ts.isTypeAliasDeclaration(node) && node.name) {
      name = node.name.text;
      type = 'Type';
      exported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ? true : false;
    } else if (ts.isEnumDeclaration(node) && node.name) {
      name = node.name.text;
      type = 'Enum';
      exported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ? true : false;
    } else if (ts.isVariableStatement(node)) {
      // Check if variables are exported or contain functions
      const isExported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ? true : false;
      node.declarationList.declarations.forEach(decl => {
        if (decl.name && ts.isIdentifier(decl.name)) {
          const varName = decl.name.text;
          let varType = 'Constant';

          if (decl.initializer) {
            if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
              varType = 'Function';
              if (/^[A-Z]/.test(varName)) {
                varType = 'Component';
              } else if (/^use[A-Z]/.test(varName)) {
                varType = 'Hook';
              }
            }
          }

          if (isExported || varType === 'Component' || varType === 'Hook') {
            symbols.push({
              name: varName,
              type: varType,
              startLine,
              endLine,
              exported: isExported
            });
          }
        }
      });
    }

    if (name && type) {
      symbols.push({
        name,
        type,
        startLine,
        endLine,
        exported
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  console.log(JSON.stringify({ symbols, imports }));
} catch (e) {
  console.error("Parsing Error:", e.message);
  process.exit(3);
}
