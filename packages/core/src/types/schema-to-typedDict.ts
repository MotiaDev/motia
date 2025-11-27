/**
 * Converts a simple schema string into Python TypedDict definitions.
 * The pipeline is split into small stages: tokenize -> parse -> name -> render.
 */
// Flow notes: comment numbers follow runtime execution starting at the entry point (1),
// even when supporting definitions live above the entry point for readability.

// === AST ==========================================================

// 0. Shared AST node shapes used by the parser and renderer.
interface Base { node: "Base"; kind: string; }
interface UnknownT { node: "Unknown"; }
interface EnumT { node: "Enum"; options: string[]; }
interface MappingType { node: "MappingType"; value: TypeNode; }
interface ArrayT { node: "Array"; item: TypeNode; }
interface Field { name: string; typ: TypeNode; optional: boolean; }
interface Obj { node: "Obj"; fields: ReadonlyArray<Field>; name?: string; }
interface UnionT { node: "Union"; members: ReadonlyArray<TypeNode>; }
type TypeNode = Base | MappingType | ArrayT | Obj | EnumT | UnionT | UnknownT;

// === TOKENIZER ====================================================

type TokenKind =
  | "LBRACE" | "RBRACE" | "COLON" | "SEMI" | "QUESTION_MARK" | "COMMA"
  | "LESS_THAN" | "GREATER_THAN" | "IDENT" | "KEY_WORD" | "PIPE"
  | "STRING_LITERAL" | "UNKNOWN";

interface Token { kind: TokenKind; value: string; pos: number; }

const KEYWORDS = new Set(["string", "number", "int", "boolean"]);
const SINGLE_CHAR_TOKENS: Record<string, TokenKind> = {
  "{": "LBRACE", "}": "RBRACE", ":": "COLON", ";": "SEMI", "?": "QUESTION_MARK",
  ",": "COMMA", "<": "LESS_THAN", ">": "GREATER_THAN", "|": "PIPE",
};

const isAlpha = (c: string) => /[A-Za-z_]/.test(c);
const isAlnum = (c: string) => /[A-Za-z0-9_]/.test(c);

// 3. Turn the raw schema string into a linear token stream for the parser.
function tokenize(src: string): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < src.length; ) {
    const c = src[i]!;
    if (/\s/.test(c)) { i++; continue; }

    const kind = SINGLE_CHAR_TOKENS[c];
    if (kind) { out.push({ kind, value: c, pos: i++ }); continue; }

    if (isAlpha(c)) {
      let j = i + 1;
      while (j < src.length && isAlnum(src[j]!)) j++;
      const word = src.slice(i, j);
      out.push({ kind: KEYWORDS.has(word) ? "KEY_WORD" : "IDENT", value: word, pos: i });
      i = j; continue;
    }

    if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1, buf = "";
      while (j < src.length) {
        const ch = src[j]!;
        if (ch === "\\" && j + 1 < src.length) { buf += src[j + 1]!; j += 2; continue; }
        if (ch === quote) { j++; break; }
        buf += ch; j++;
      }

      out.push({ kind: "STRING_LITERAL", value: buf, pos: i });
      i = j; continue;
    }

    out.push({ kind: "UNKNOWN", value: c, pos: i++ });
  }
  return out;
}

// === PARSER =======================================================

class Parser {
  private index = 0;

  constructor(private tokens: Token[], private src = "") {}

  // 4. Parse the full token list into an Obj tree and assert no trailing tokens.
  public parseRoot(): Obj {
    const root = this.parseObject();
    if (!this.eof()) throw new SyntaxError(`Unexpected trailing tokens at pos ${this.pos()}`);
    return root;
  }

  private peek(k = 0): Token | null {
    const j = this.index + k;
    return j >= 0 && j < this.tokens.length ? this.tokens[j]! : null;
  }

  private expect(kind: TokenKind): Token {
    const t = this.peek();
    if (!t || t.kind !== kind) {
      const got = t ? t.kind : "EOF";
      const pos = t ? t.pos : "EOF";
      throw new SyntaxError(`Expected ${kind}, got ${got} at pos ${pos}. The source schema is : ${this.src}`);
    }
    this.index++; return t;
  }

  private accept(kind: TokenKind): Token | null {
    const t = this.peek();
    if (t && t.kind === kind) { this.index++; return t; }
    return null;
  }

  private eof(): boolean { return this.index >= this.tokens.length; }
  private pos(): number | "EOF" { return this.peek()?.pos ?? "EOF"; }

  // 5. Parse an object: { field?: Type; ... }.
  private parseObject(): Obj {
    this.expect("LBRACE");
    const fields: Field[] = [];
    for (let t = this.peek(); t && t.kind !== "RBRACE"; t = this.peek()) {
      fields.push(this.parseField());
      while (this.accept("SEMI") || this.accept("COMMA")) {}
    }
    this.expect("RBRACE");
    return { node: "Obj", fields };
  }

  // 6. Parse a single field with optional marker and a type.
  private parseField(): Field {
    const name = this.expect("IDENT").value;
    const optional = !!this.accept("QUESTION_MARK");
    this.expect("COLON");
    return { name, typ: this.parseType(), optional };
  }

  // 7. Parse a union of atomic types (A | B | ...).
  private parseType(): TypeNode {
    const members: TypeNode[] = [this.parseAtomic()];
    while (this.accept("PIPE")) members.push(this.parseAtomic());
    return buildUnion(members);
  }

  // 8. Parse a single atomic type: literal, object, Array<T>, Record<string, T>, or base.
  private parseAtomic(): TypeNode {
    const t = this.peek();
    if (!t) throw new SyntaxError("Unexpected EOF while parsing Type");

    if (t.kind === "STRING_LITERAL") {
      const value = this.expect("STRING_LITERAL").value;
      return { node: "Enum", options: [value] };
    }

    if (t.kind === "LBRACE") return this.parseObject();

    if (this.isIdent("Array")) return this.parseArrayType();
    if (this.isIdent("Record")) return this.parseRecordType();

    if (t.kind === "KEY_WORD") return { node: "Base", kind: this.expect("KEY_WORD").value };
    if (t.kind === "UNKNOWN") { this.expect("UNKNOWN"); return { node: "Unknown" }; }

    throw new SyntaxError(`Unexpected token ${JSON.stringify(t)} in Primary. The source schema was : ${this.src}`);
  }

  // 9. Parse Array<Inner>.
  private parseArrayType(): TypeNode {
    this.expect("IDENT"); this.expect("LESS_THAN");
    const val = this.parseType();
    this.expect("GREATER_THAN");
    return { node: "Array", item: val };
  }

  // 10. Parse Record<string, Inner>.
  private parseRecordType(): TypeNode {
    this.expect("IDENT"); this.expect("LESS_THAN");
    const key = this.expect("KEY_WORD");
    if (key.value !== "string")
      throw new SyntaxError(`Only Record<string, ...> supported at pos ${key.pos}`);
    this.expect("COMMA");
    const val = this.parseType();
    this.expect("GREATER_THAN");
    return { node: "MappingType", value: val };
  }

  private isIdent(value: string) {
    const t = this.peek();
    return t?.kind === "IDENT" && t.value === value;
  }
}

// 2. Convert schema text into a parsed Obj tree by tokenizing then running the parser.
function parseSchema(src: string): Obj {
  const parser = new Parser(tokenize(src), src);
  return parser.parseRoot();
}

// 11. Normalize unions: flatten nested unions and compress single-literal enums.
function buildUnion(members: TypeNode[]): TypeNode {
  if (members.length === 1) return members[0]!;
  const flat = members.flatMap(m => (m.node === "Union" ? (m as UnionT).members : [m]));
  const isSingleLiteralEnum = flat.every(m => m.node === "Enum" && (m as EnumT).options.length === 1);
  return isSingleLiteralEnum
    ? { node: "Enum", options: flat.map(e => (e as EnumT).options[0]!) }
    : { node: "Union", members: flat };
}

// === HELPERS ======================================================

const PYTHON_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class",
  "continue","def","del","elif","else","except","finally","for","from","global",
  "if","import","in","is","lambda","nonlocal","not","or","pass","raise","return",
  "try","while","with","yield"
]);

// === RENDERER =====================================================

// 12. Render the collected objects into TypedDict class definitions.
function renderTypedDicts(root: Obj, rootName = "Root"): string {
  const { objs } = collectObjects(root, rootName);
  const wrapOptional = (s: string, o: boolean) => (o ? `NotRequired[${s}]` : s);
  const lines: string[] = [];

  for (const obj of objs) {
    const clsName = obj.name!;
    const fields = obj.fields;

    if (fields.every(f => validIdentifier(f.name))) {
      lines.push(`class ${clsName}(TypedDict):`);
      for (const f of fields) lines.push(`    ${f.name}: ${wrapOptional(toPythonType(f.typ), f.optional)}`);
    } else {
      lines.push(`${clsName} = TypedDict("${clsName}", {`);
      fields.forEach((f, i) => {
        const comma = i < fields.length - 1 ? "," : "";
        lines.push(`    ${JSON.stringify(f.name)}: ${wrapOptional(toPythonType(f.typ), f.optional)}${comma}`);
      });
      lines.push("})");
    }
    lines.push("");
  }

  return lines.join("\n");
}

// === OBJECT COLLECTION ===========================================

/**
 * Walks the tree, assigns stable names to Obj nodes,
 * returns ordered list of unique objects (bottom-up).
 */
// 12.1 Collect all object shapes, name them, and order bottom-up for rendering.
function collectObjects(root: Obj, rootHint = "Root") {
  const nameMap = new Map<string, string>();
  const used = new Set<string>();
  const orderedObjs: Obj[] = [];
  const seenNames = new Set<string>();

  const visit = (t: TypeNode, path: string[]) => {
    switch (t.node) {
      case "Obj": {
        if (!t.fields.length) return;

        const name = nameForObject(t, path, nameMap, used);
        t.name = name;

        if (!seenNames.has(name)) {
          for (const f of t.fields) visit(f.typ, path.concat(f.name));
          seenNames.add(name);
          orderedObjs.push(t);
        }
        break;
      }
      case "Array": visit(t.item, path); break;
      case "MappingType": visit(t.value, path); break;
      case "Union": t.members.forEach(m => visit(m, path)); break;
      default: break;
    }
  };

  visit(root, [rootHint]);
  return { objs: orderedObjs };
}

// 12.1.1 Build a stable structural signature for a type, used for deduping object names.
type Sig =
  | ["base", string]
  | ["array", Sig]
  | ["obj", ReadonlyArray<[string, boolean, Sig]>]
  | ["mapping", Sig]
  | ["enum", string[]]
  | ["union", Sig[]]
  | ["unknown"];

function typeSignature(t: TypeNode): Sig {
  switch (t.node) {
    case "Base": return ["base", t.kind];
    case "Array": return ["array", typeSignature(t.item)];
    case "MappingType": return ["mapping", typeSignature(t.value)];
    case "Unknown": return ["unknown"];
    case "Enum": return ["enum", [...t.options].sort()];
    case "Obj": {
      const items = [...t.fields]
        .map(f => [f.name, f.optional, typeSignature(f.typ)] as [string, boolean, Sig])
        .sort((a, b) => a[0].localeCompare(b[0]));
      return ["obj", items];
    }
    case "Union": {
      const parts = t.members.map(typeSignature);
      const sorted = parts
        .map(p => JSON.stringify(p))
        .sort()
        .map(s => JSON.parse(s) as Sig);
      return ["union", sorted];
    }
  }
}

// 12.1.2 Validate candidate Python identifier names.
const validIdentifier = (n: string) =>
  /^[A-Za-z_]\w*$/.test(n) && !PYTHON_KEYWORDS.has(n);

// 12.1.3 Generate a unique name variant when a preferred name is already taken.
function uniquify(base: string, used: Set<string>): string {
  if (!used.has(base)) { used.add(base); return base; }
  let k = 2; while (used.has(`${base}${k}`)) k++;
  const name = `${base}${k}`; used.add(name); return name;
}

// 12.1.4 Assign a stable name to an object shape, reusing signatures where possible.
function nameForObject(obj: Obj, path: string[], nameMap: Map<string, string>, used: Set<string>): string {
  const sig = JSON.stringify(typeSignature(obj));
  const found = nameMap.get(sig);
  if (found) return found;

  let raw = path.filter(Boolean).join("_") || "Root";
  if (!validIdentifier(raw)) raw = "Type";

  const name = uniquify(raw, used);
  nameMap.set(sig, name);
  return name;
}

// === PYTHON TYPE MAPPING ==========================================

// 12.2 Map a TypeNode into its Python type representation.
function toPythonType(t: TypeNode): string {
  switch (t.node) {
    case "Base":
      return t.kind === "string" ? "str"
        : t.kind === "number" ? "float"
        : t.kind === "int" ? "int"
        : t.kind === "boolean" ? "bool"
        : "Any";
    case "Array": return `list[${toPythonType(t.item)}]`;
    case "Obj":
      if (!t.fields.length) return "Mapping[str, object]";
      if (!t.name) throw new Error("Invariant violated: Obj.name not set. Run collectObjects first.");
      return t.name;
    case "MappingType": return `Mapping[str, ${toPythonType(t.value)}]`;
    case "Enum": return `Literal[${t.options.map(o => JSON.stringify(o)).join(", ")}]`;
    case "Union": return t.members.map(toPythonType).join(" | ");
    case "Unknown": return "Any";
  }
}

// === ENTRY POINT ==================================================

// 1. Entry point: parse the schema then render Python TypedDict classes.
export function schema_to_typeddict(src: string, rootName = "Root"): string {
  const root: TypeNode = parseSchema(src);
  return renderTypedDicts(root, rootName);
}
