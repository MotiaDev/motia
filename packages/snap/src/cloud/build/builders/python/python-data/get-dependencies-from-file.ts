import { type ANTLRErrorListener, CharStreams, CommonTokenStream, type Token } from 'antlr4ts'
import { createVisitor } from 'python-ast'
import { Python3Lexer } from 'python-ast/dist/parser/Python3Lexer.js'
import { Python3Parser } from 'python-ast/dist/parser/Python3Parser.js'
import { STANDARD_LIB_MODULES } from './constants'
import { PythonCompilationError } from './python-errors'

function parse(source: string, sourceName: string) {
  const chars = CharStreams.fromString(source, sourceName)
  const lexer = new Python3Lexer(chars)
  const tokens = new CommonTokenStream(lexer)
  const parser = new Python3Parser(tokens)

  // Remove default console error listeners
  parser.removeErrorListeners()

  const listener: ANTLRErrorListener<Token> = {
    syntaxError: (_recognizer, _offendingSymbol, line, charPositionInLine, msg) => {
      throw new PythonCompilationError(sourceName, `${msg} at line ${line}:${charPositionInLine}`)
    },
  }

  // Add your custom one
  parser.addErrorListener(listener)

  return parser.file_input()
}

export type Dependencies = {
  standardLibDependencies: Set<string>
  externalDependencies: Set<string>
  projectDependencies: Set<string>
}

export const getDependenciesFromFile = (
  content: string,
  path: string,
  externalDependenciesMap: Record<string, string>,
): Dependencies => {
  const result = parse(content + '\n', path)
  const modulesSet = new Set<string>()

  createVisitor({
    visitImport_from: (ctx) => {
      const name = ctx.dotted_name()

      if (name) {
        let dots = ctx
          .DOT()
          .map((dot) => dot.text)
          .join('')

        const dotsText = ctx.getChild(1)?.text ?? ''

        // when ...package the parser doesn't return as ctx.DOT() — we need to handle it manually
        if (!dots && dotsText[0] === '.') {
          dots = dotsText
        }

        modulesSet.add(dots.concat(name.text))
      }
    },
    visitImport_name: (ctx) => {
      const names = ctx.dotted_as_names()
      modulesSet.add(names.dotted_as_name(0)?.getChild(0)?.text ?? names.text)
    },
  }).visit(result)

  const dependencies: Dependencies = {
    standardLibDependencies: new Set(),
    externalDependencies: new Set(),
    projectDependencies: new Set(),
  }

  for (const module of modulesSet) {
    const [moduleName] = module.split('.')

    if (module[0] === '.') {
      dependencies.projectDependencies.add(module)
    } else if (STANDARD_LIB_MODULES.has(module)) {
      dependencies.standardLibDependencies.add(module)
    } else if (externalDependenciesMap[module] || externalDependenciesMap[moduleName]) {
      dependencies.externalDependencies.add(module)
    } else {
      dependencies.projectDependencies.add(module)
    }
  }

  return dependencies
}
